import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_free(client: AsyncClient):
    r = await client.get("/profile")
    assert r.status_code == 200
    data = r.json()
    assert data["plan"] == "free"
    assert data["is_admin"] is False


@pytest.mark.asyncio
async def test_get_profile_premium(premium_client: AsyncClient):
    r = await premium_client.get("/profile")
    assert r.status_code == 200
    assert r.json()["plan"] == "premium"


@pytest.mark.asyncio
async def test_get_profile_admin(admin_client: AsyncClient):
    r = await admin_client.get("/profile")
    assert r.status_code == 200
    data = r.json()
    assert data["plan"] == "premium"
    assert data["is_admin"] is True
