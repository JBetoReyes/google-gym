"""
Auth module — handles anonymous → registered migration.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.dependencies import CurrentProfile, DbSession
from app.models.exercise import CustomExercise
from app.models.preference import UserPreference
from app.models.routine import Routine
from app.models.session import Session

router = APIRouter(prefix="/auth", tags=["auth"])


class SetLogItem(BaseModel):
    weight: str
    reps: str
    isPR: bool | None = None


class MigratePayload(BaseModel):
    routines: list[dict]
    sessions: list[dict]
    custom_exercises: list[dict]
    preferences: dict | None = None


@router.post("/migrate")
async def migrate_anonymous_data(
    body: MigratePayload,
    profile=CurrentProfile,
    db: DbSession = None,
) -> dict:
    """
    Called after a user registers/logs in for the first time.
    Receives the full localStorage dump and upserts it into the DB.
    Existing DB records are NOT overwritten.
    """
    routines_added = 0
    sessions_added = 0
    exercises_added = 0

    for r in body.routines:
        routine = Routine(
            user_id=profile.id,
            name=r.get("name", ""),
            exercises=r.get("exercises", []),
        )
        db.add(routine)
        routines_added += 1

    for s in body.sessions:
        session = Session(
            user_id=profile.id,
            routine_name=s.get("routineName", ""),
            started_at=s.get("date", ""),
            finished_at=s.get("date", ""),
            duration_minutes=s.get("duration", 0),
            logs=s.get("logs", {}),
        )
        db.add(session)
        sessions_added += 1

    for e in body.custom_exercises:
        ex = CustomExercise(
            id=e.get("id", f"custom_{id(e)}"),
            user_id=profile.id,
            name=e.get("name", ""),
            muscle=e.get("muscle", ""),
        )
        db.add(ex)
        exercises_added += 1

    if body.preferences:
        prefs = UserPreference(
            user_id=profile.id,
            weekly_goal=body.preferences.get("weeklyGoal", 4),
            lang=body.preferences.get("lang", "es"),
            rest_timer_default=body.preferences.get("restTimerDefault", 90),
            theme=body.preferences.get("theme", "dark"),
            exercise_buttons=body.preferences.get("exerciseButtons", {}),
        )
        db.add(prefs)

    await db.commit()

    return {
        "migrated": {
            "routines": routines_added,
            "sessions": sessions_added,
            "exercises": exercises_added,
        }
    }
