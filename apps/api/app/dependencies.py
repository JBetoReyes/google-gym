from collections.abc import AsyncGenerator
from typing import Annotated

import httpx
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.profile import Profile

# ── JWKS cache (fetched once per process) ──────────────────────────────────────
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
                timeout=5,
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def _verify_jwt(authorization: str = Header(default="")) -> str:
    """Extract and verify Supabase JWT (HS256 or ES256); return user_id (sub)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.removeprefix("Bearer ")
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        kid = header.get("kid")

        if alg == "HS256":
            key: str | dict = settings.supabase_jwt_secret
        else:
            # ES256/RS256 — find the matching JWK from Supabase JWKS endpoint
            jwks = await _get_jwks()
            keys = jwks.get("keys", [])
            # Match by kid if present, otherwise use first key
            matched = next((k for k in keys if k.get("kid") == kid), None) if kid else None
            key = matched or (keys[0] if keys else None)
            if key is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No signing key found")

        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
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
