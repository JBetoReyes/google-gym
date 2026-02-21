import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.main import app


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "version": "2.0.0"}


@pytest.mark.asyncio
async def test_docs_available(client: AsyncClient):
    r = await client.get("/docs")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_unauthorized_without_override(db_session: AsyncSession):
    """Hitting a protected route without a JWT should return 401.

    We override get_db with the in-memory session so FastAPI can resolve that
    dependency without attempting a real PostgreSQL connection. The JWT check
    (_verify_jwt) still runs and must fail with 401.
    """
    async def _override_db():
        yield db_session

    # Ensure clean state — no leftover profile override from other tests.
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = _override_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            r = await ac.get("/routines")  # no Authorization header
        assert r.status_code == 401
    finally:
        app.dependency_overrides.clear()
