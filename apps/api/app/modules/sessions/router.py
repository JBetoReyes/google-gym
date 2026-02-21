from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentProfile, DbSession
from app.models.session import Session
from app.modules.sessions.repository import PostgresSessionRepository
from app.modules.sessions.schemas import SessionCreate, SessionRead

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionRead])
async def list_sessions(profile: CurrentProfile, db: DbSession) -> list[SessionRead]:
    repo = PostgresSessionRepository(db)
    return await repo.list(profile.id)  # type: ignore[return-value]


@router.post("", response_model=SessionRead, status_code=201)
async def create_session(
    body: SessionCreate, profile: CurrentProfile, db: DbSession
) -> SessionRead:
    repo = PostgresSessionRepository(db)
    session = Session(
        user_id=profile.id,
        routine_id=body.routine_id,
        routine_name=body.routine_name,
        started_at=body.started_at,
        finished_at=body.finished_at,
        duration_minutes=body.duration_minutes,
        logs={k: [s.model_dump(exclude_none=True) for s in v] for k, v in body.logs.items()},
    )
    return await repo.create(session)  # type: ignore[return-value]


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str, profile: CurrentProfile, db: DbSession
) -> None:
    repo = PostgresSessionRepository(db)
    deleted = await repo.delete(session_id, profile.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
