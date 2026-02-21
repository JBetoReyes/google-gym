from fastapi import APIRouter

from app.dependencies import CurrentProfile

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
async def get_profile(profile: CurrentProfile) -> dict:
    return {"plan": profile.plan, "is_admin": profile.is_admin}
