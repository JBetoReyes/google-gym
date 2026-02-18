from abc import ABC, abstractmethod

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.routine import Routine


class RoutineRepository(ABC):
    """Interface — Liskov-substitutable storage backend."""

    @abstractmethod
    async def list(self, user_id: str) -> list[Routine]: ...

    @abstractmethod
    async def get(self, routine_id: str, user_id: str) -> Routine | None: ...

    @abstractmethod
    async def count(self, user_id: str) -> int: ...

    @abstractmethod
    async def create(self, routine: Routine) -> Routine: ...

    @abstractmethod
    async def update(self, routine: Routine) -> Routine: ...

    @abstractmethod
    async def delete(self, routine_id: str, user_id: str) -> bool: ...


class PostgresRoutineRepository(RoutineRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list(self, user_id: str) -> list[Routine]:
        result = await self._db.execute(
            select(Routine)
            .where(Routine.user_id == user_id)
            .order_by(Routine.position, Routine.created_at)
        )
        return list(result.scalars().all())

    async def get(self, routine_id: str, user_id: str) -> Routine | None:
        result = await self._db.execute(
            select(Routine).where(
                Routine.id == routine_id, Routine.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def count(self, user_id: str) -> int:
        result = await self._db.execute(
            select(Routine).where(Routine.user_id == user_id)
        )
        return len(result.scalars().all())

    async def create(self, routine: Routine) -> Routine:
        self._db.add(routine)
        await self._db.commit()
        await self._db.refresh(routine)
        return routine

    async def update(self, routine: Routine) -> Routine:
        await self._db.commit()
        await self._db.refresh(routine)
        return routine

    async def delete(self, routine_id: str, user_id: str) -> bool:
        result = await self._db.execute(
            delete(Routine).where(
                Routine.id == routine_id, Routine.user_id == user_id
            )
        )
        await self._db.commit()
        return result.rowcount > 0
