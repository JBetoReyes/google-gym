from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.profile import Profile


async def _verify_jwt(authorization: str = Header(default="")) -> str:
    """Extract and verify Supabase JWT; return user_id (sub)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc


CurrentUserId = Annotated[str, Depends(_verify_jwt)]


async def get_or_create_profile(
    user_id: CurrentUserId,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Profile:
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = Profile(id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


CurrentProfile = Annotated[Profile, Depends(get_or_create_profile)]


async def require_premium(profile: CurrentProfile) -> Profile:
    if profile.plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required",
        )
    return profile


async def require_admin(profile: CurrentProfile) -> Profile:
    if not profile.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return profile


PremiumProfile = Annotated[Profile, Depends(require_premium)]
AdminProfile = Annotated[Profile, Depends(require_admin)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
