from fastapi import HTTPException, status

from app.models.routine import Routine
from app.modules.routines.repository import RoutineRepository
from app.modules.routines.schemas import RoutineCreate, RoutineUpdate


class RoutineService:
    def __init__(self, repo: RoutineRepository, free_limit: int = 3) -> None:
        self._repo = repo
        self._free_limit = free_limit

    async def list_routines(self, user_id: str) -> list[Routine]:
        return await self._repo.list(user_id)

    async def get_routine(self, routine_id: str, user_id: str) -> Routine:
        routine = await self._repo.get(routine_id, user_id)
        if routine is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
        return routine

    async def create_routine(
        self, user_id: str, data: RoutineCreate, is_premium: bool
    ) -> Routine:
        if not is_premium:
            count = await self._repo.count(user_id)
            if count >= self._free_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Free tier limited to {self._free_limit} routines. Upgrade to Premium.",
                )
        routine = Routine(
            user_id=user_id,
            name=data.name,
            exercises=data.exercises,
            position=data.position,
        )
        return await self._repo.create(routine)

    async def update_routine(
        self, routine_id: str, user_id: str, data: RoutineUpdate
    ) -> Routine:
        routine = await self.get_routine(routine_id, user_id)
        if data.name is not None:
            routine.name = data.name
        if data.exercises is not None:
            routine.exercises = data.exercises
        if data.position is not None:
            routine.position = data.position
        return await self._repo.update(routine)

    async def delete_routine(self, routine_id: str, user_id: str) -> None:
        deleted = await self._repo.delete(routine_id, user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
