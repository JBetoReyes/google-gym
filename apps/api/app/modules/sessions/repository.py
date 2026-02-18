from abc import ABC, abstractmethod

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import Session


class SessionRepository(ABC):
    @abstractmethod
    async def list(self, user_id: str) -> list[Session]: ...

    @abstractmethod
    async def create(self, session: Session) -> Session: ...

    @abstractmethod
    async def delete(self, session_id: str, user_id: str) -> bool: ...


class PostgresSessionRepository(SessionRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list(self, user_id: str) -> list[Session]:
        result = await self._db.execute(
            select(Session)
            .where(Session.user_id == user_id)
            .order_by(Session.finished_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, session: Session) -> Session:
        self._db.add(session)
        await self._db.commit()
        await self._db.refresh(session)
        return session

    async def delete(self, session_id: str, user_id: str) -> bool:
        result = await self._db.execute(
            delete(Session).where(
                Session.id == session_id, Session.user_id == user_id
            )
        )
        await self._db.commit()
        return result.rowcount > 0
