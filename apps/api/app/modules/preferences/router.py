from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentProfile, DbSession
from app.models.preference import UserPreference
from app.modules.preferences.schemas import PreferencesRead, PreferencesUpdate
from sqlalchemy import select

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("", response_model=PreferencesRead)
async def get_preferences(profile: CurrentProfile, db: DbSession) -> PreferencesRead:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == profile.id)
    )
    prefs = result.scalar_one_or_none()
    if prefs is None:
        prefs = UserPreference(user_id=profile.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs  # type: ignore[return-value]


@router.put("", response_model=PreferencesRead)
async def update_preferences(
    body: PreferencesUpdate, profile: CurrentProfile, db: DbSession
) -> PreferencesRead:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == profile.id)
    )
    prefs = result.scalar_one_or_none()
    if prefs is None:
        prefs = UserPreference(user_id=profile.id)
        db.add(prefs)

    # Theme is premium-gated
    if body.theme is not None and body.theme != "dark":
        if profile.plan != "premium":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Custom themes require a Premium subscription",
            )
        prefs.theme = body.theme

    if body.weekly_goal is not None:
        prefs.weekly_goal = body.weekly_goal
    if body.lang is not None:
        prefs.lang = body.lang
    if body.rest_timer_default is not None:
        prefs.rest_timer_default = body.rest_timer_default
    if body.exercise_buttons is not None:
        current = dict(prefs.exercise_buttons or {})
        if body.exercise_buttons.routineForm is not None:
            current["routineForm"] = body.exercise_buttons.routineForm
        if body.exercise_buttons.workoutView is not None:
            current["workoutView"] = body.exercise_buttons.workoutView
        prefs.exercise_buttons = current

    await db.commit()
    await db.refresh(prefs)
    return prefs  # type: ignore[return-value]
