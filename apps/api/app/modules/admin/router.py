from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.dependencies import AdminProfile, DbSession
from app.models.app_config import AppConfig
from app.models.profile import Profile
from app.models.session import Session

router = APIRouter(prefix="/admin", tags=["admin"])


class ConfigUpdate(BaseModel):
    value: dict


@router.get("/config")
async def get_all_config(profile=AdminProfile, db: DbSession = None) -> list[dict]:
    result = await db.execute(select(AppConfig))
    return [{"key": c.key, "value": c.value} for c in result.scalars().all()]


@router.put("/config/{key}")
async def update_config(
    key: str, body: ConfigUpdate, profile=AdminProfile, db: DbSession = None
) -> dict:
    result = await db.execute(select(AppConfig).where(AppConfig.key == key))
    config = result.scalar_one_or_none()
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config key not found")
    config.value = body.value
    config.updated_by = profile.id
    await db.commit()
    await db.refresh(config)
    return {"key": config.key, "value": config.value}


@router.get("/users")
async def list_users(profile=AdminProfile, db: DbSession = None) -> dict:
    result = await db.execute(select(Profile))
    profiles = list(result.scalars().all())
    free_count = sum(1 for p in profiles if p.plan == "free")
    premium_count = sum(1 for p in profiles if p.plan == "premium")

    from datetime import date, timedelta
    today_start = date.today().isoformat()
    sessions_today_result = await db.execute(
        select(func.count()).where(Session.finished_at >= today_start)
    )
    sessions_today = sessions_today_result.scalar() or 0

    return {
        "total_users": len(profiles),
        "free_users": free_count,
        "premium_users": premium_count,
        "sessions_today": sessions_today,
    }
