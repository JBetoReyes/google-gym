"""
Shared pytest fixtures for the GymTracker API test suite.

Strategy:
- Each test gets its own SQLite in-memory engine → full data isolation.
- Override `get_db` to inject the test session.
- Override `get_or_create_profile` to skip JWT verification.

To run:
    cd apps/api
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements-dev.txt   # includes aiosqlite
    pytest
"""
import json

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ---------------------------------------------------------------------------
# SQLite type-compiler patches — applied before any model import so that
# CREATE TABLE DDL is rendered correctly in the in-memory test database.
# ---------------------------------------------------------------------------
SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"  # type: ignore[attr-defined]
SQLiteTypeCompiler.visit_UUID = lambda self, type_, **kw: "VARCHAR(36)"  # type: ignore[attr-defined]

# ARRAY → TEXT (JSON-encoded).  We also patch bind/result processors below.
SQLiteTypeCompiler.visit_ARRAY = lambda self, type_, **kw: "TEXT"  # type: ignore[attr-defined]

# Patch PostgreSQL ARRAY bind/result processors to use JSON for SQLite.
from sqlalchemy.dialects.postgresql import ARRAY as _PG_ARRAY  # noqa: E402

_orig_bind = _PG_ARRAY.bind_processor
_orig_result = _PG_ARRAY.result_processor


def _array_bind(self, dialect):  # type: ignore[override]
    if dialect.name == "sqlite":
        return lambda value: json.dumps(value) if value is not None else None
    return _orig_bind(self, dialect)


def _array_result(self, dialect, coltype):  # type: ignore[override]
    if dialect.name == "sqlite":
        return lambda value: json.loads(value) if value is not None else None
    return _orig_result(self, dialect, coltype)


_PG_ARRAY.bind_processor = _array_bind  # type: ignore[method-assign]
_PG_ARRAY.result_processor = _array_result  # type: ignore[method-assign]

from app.database import Base, get_db  # noqa: E402
from app.dependencies import get_or_create_profile  # noqa: E402
from app.main import app  # noqa: E402
from app.models.profile import Profile  # noqa: F401, E402 — ensures table is registered


class _FakeProfile:
    """Minimal stand-in for a SQLAlchemy Profile row."""
    def __init__(self, user_id: str = "00000000-0000-0000-0000-000000000001", plan: str = "free", is_admin: bool = False):
        self.id = user_id
        self.plan = plan
        self.is_admin = is_admin
        self.stripe_customer_id: str | None = None
        self.stripe_subscription_id: str | None = None
        self.created_at = "2026-01-01T00:00:00"


# ---------------------------------------------------------------------------
# Per-test engine + session (each test gets its own fresh in-memory DB)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session

    await engine.dispose()


# ---------------------------------------------------------------------------
# Client factories
# ---------------------------------------------------------------------------

def _make_client(db_session: AsyncSession, profile: _FakeProfile):
    async def _override_db():
        yield db_session

    async def _override_profile():
        return profile

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_or_create_profile] = _override_profile
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession):
    """Free-tier authenticated client."""
    async with _make_client(db_session, _FakeProfile()) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def premium_client(db_session: AsyncSession):
    """Premium authenticated client."""
    async with _make_client(db_session, _FakeProfile(plan="premium")) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def admin_client(db_session: AsyncSession):
    """Admin authenticated client."""
    async with _make_client(db_session, _FakeProfile(plan="premium", is_admin=True)) as ac:
        yield ac
    app.dependency_overrides.clear()
