"""
Public app config endpoint — no auth required.
Returns ad frequency, free tier limits, etc.
"""
from fastapi import APIRouter
from sqlalchemy import select

from app.database import get_db
from app.models.app_config import AppConfig
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
async def get_config(db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(AppConfig))
    return {c.key: c.value for c in result.scalars().all()}
