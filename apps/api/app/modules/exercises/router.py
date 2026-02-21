from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentProfile, DbSession
from app.models.exercise import CustomExercise
from app.modules.exercises.schemas import ExerciseCreate, ExerciseRead, ExerciseUpdate
from sqlalchemy import delete, select

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseRead])
async def list_exercises(profile: CurrentProfile, db: DbSession) -> list[ExerciseRead]:
    result = await db.execute(
        select(CustomExercise).where(CustomExercise.user_id == profile.id)
    )
    return result.scalars().all()  # type: ignore[return-value]


@router.post("", response_model=ExerciseRead, status_code=201)
async def create_exercise(
    body: ExerciseCreate, profile: CurrentProfile, db: DbSession
) -> ExerciseRead:
    ex = CustomExercise(id=body.id, user_id=profile.id, name=body.name, muscle=body.muscle)
    db.add(ex)
    await db.commit()
    await db.refresh(ex)
    return ex  # type: ignore[return-value]


@router.put("/{exercise_id}", response_model=ExerciseRead)
async def update_exercise(
    exercise_id: str, body: ExerciseUpdate, profile: CurrentProfile, db: DbSession
) -> ExerciseRead:
    result = await db.execute(
        select(CustomExercise).where(
            CustomExercise.id == exercise_id, CustomExercise.user_id == profile.id
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    if body.name is not None:
        ex.name = body.name
    if body.muscle is not None:
        ex.muscle = body.muscle
    await db.commit()
    await db.refresh(ex)
    return ex  # type: ignore[return-value]


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: str, profile: CurrentProfile, db: DbSession
) -> None:
    result = await db.execute(
        delete(CustomExercise).where(
            CustomExercise.id == exercise_id, CustomExercise.user_id == profile.id
        )
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
