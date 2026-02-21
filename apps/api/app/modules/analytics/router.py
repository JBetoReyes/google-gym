"""
Analytics endpoints.

- GET /analytics/basic  — free: total workouts, sets, avg duration, streak
- GET /analytics        — premium: all 5 chart datasets + stats
"""
from fastapi import APIRouter

from app.dependencies import CurrentProfile, DbSession, PremiumProfile
from app.models.session import Session
from app.models.preference import UserPreference
from sqlalchemy import select

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _fetch_sessions(user_id: str, db) -> list[Session]:
    result = await db.execute(
        select(Session).where(Session.user_id == user_id).order_by(Session.finished_at)
    )
    return list(result.scalars().all())


@router.get("/basic")
async def basic_analytics(profile: CurrentProfile, db: DbSession) -> dict:
    sessions = await _fetch_sessions(profile.id, db)
    total_sets = sum(
        sum(len(sets) for sets in s.logs.values()) for s in sessions
    )
    durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]
    avg_dur = round(sum(durations) / len(durations)) if durations else 0

    return {
        "total_workouts": len(sessions),
        "total_sets": total_sets,
        "avg_duration": avg_dur,
        "total_minutes": sum(s.duration_minutes for s in sessions),
    }


@router.get("")
async def full_analytics(profile: PremiumProfile, db: DbSession) -> dict:
    sessions = await _fetch_sessions(profile.id, db)

    # Volume data: {date, volume}
    volume = [
        {
            "date": s.finished_at,
            "volume": sum(
                float(log["weight"]) * float(log["reps"])
                for sets in s.logs.values()
                for log in sets
                if _is_numeric(log.get("weight")) and _is_numeric(log.get("reps"))
            ),
        }
        for s in sessions
    ]

    # Duration data
    duration = [{"date": s.finished_at, "minutes": s.duration_minutes} for s in sessions]

    # Sets data
    sets_data = [
        {
            "date": s.finished_at,
            "sets": sum(len(v) for v in s.logs.values()),
        }
        for s in sessions
    ]

    # Muscle split
    muscle_counts: dict[str, int] = {}
    for s in sessions:
        for sets in s.logs.values():
            for log in sets:
                muscle = log.get("muscle")
                if muscle:
                    muscle_counts[muscle] = muscle_counts.get(muscle, 0) + 1

    # Frequency (sessions per week)
    freq: dict[str, int] = {}
    for s in sessions:
        from datetime import date
        d = date.fromisoformat(s.finished_at[:10])
        iso = d.isocalendar()
        week_key = f"{iso.year}-W{iso.week:02d}"
        freq[week_key] = freq.get(week_key, 0) + 1

    total_sets = sum(sum(len(v) for v in s.logs.values()) for s in sessions)
    durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]
    avg_dur = round(sum(durations) / len(durations)) if durations else 0

    return {
        "stats": {
            "total_workouts": len(sessions),
            "total_sets": total_sets,
            "avg_duration": avg_dur,
            "total_minutes": sum(s.duration_minutes for s in sessions),
        },
        "charts": {
            "volume": volume,
            "duration": duration,
            "sets": sets_data,
            "muscle_split": [{"muscle": k, "sets": v} for k, v in muscle_counts.items()],
            "frequency": [{"week": k, "count": v} for k, v in sorted(freq.items())],
        },
    }


def _is_numeric(v: object) -> bool:
    try:
        float(v)  # type: ignore[arg-type]
        return True
    except (TypeError, ValueError):
        return False
