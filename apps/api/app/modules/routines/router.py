from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import CurrentProfile, DbSession
from app.modules.routines.repository import PostgresRoutineRepository
from app.modules.routines.schemas import RoutineCreate, RoutineRead, RoutineUpdate
from app.modules.routines.service import RoutineService

router = APIRouter(prefix="/routines", tags=["routines"])


def _get_service(db: DbSession) -> RoutineService:
    return RoutineService(PostgresRoutineRepository(db))


@router.get("", response_model=list[RoutineRead])
async def list_routines(
    profile=CurrentProfile,
    service: RoutineService = Depends(_get_service),
) -> list[RoutineRead]:
    return await service.list_routines(profile.id)  # type: ignore[return-value]


@router.post("", response_model=RoutineRead, status_code=201)
async def create_routine(
    body: RoutineCreate,
    profile=CurrentProfile,
    service: RoutineService = Depends(_get_service),
) -> RoutineRead:
    routine = await service.create_routine(profile.id, body, profile.plan == "premium")
    return routine  # type: ignore[return-value]


@router.put("/{routine_id}", response_model=RoutineRead)
async def update_routine(
    routine_id: str,
    body: RoutineUpdate,
    profile=CurrentProfile,
    service: RoutineService = Depends(_get_service),
) -> RoutineRead:
    return await service.update_routine(routine_id, profile.id, body)  # type: ignore[return-value]


@router.delete("/{routine_id}", status_code=204)
async def delete_routine(
    routine_id: str,
    profile=CurrentProfile,
    service: RoutineService = Depends(_get_service),
) -> None:
    await service.delete_routine(routine_id, profile.id)
