import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_preferences_defaults(client: AsyncClient):
    r = await client.get("/preferences")
    assert r.status_code == 200
    data = r.json()
    assert data["lang"] == "es"
    assert data["weekly_goal"] == 4
    assert data["rest_timer_default"] == 90
    assert data["theme"] == "dark"


@pytest.mark.asyncio
async def test_update_language(client: AsyncClient):
    r = await client.put("/preferences", json={"lang": "es"})
    assert r.status_code == 200
    assert r.json()["lang"] == "es"

    # Persisted
    r = await client.get("/preferences")
    assert r.json()["lang"] == "es"


@pytest.mark.asyncio
async def test_update_weekly_goal(client: AsyncClient):
    r = await client.put("/preferences", json={"weekly_goal": 6})
    assert r.status_code == 200
    assert r.json()["weekly_goal"] == 6


@pytest.mark.asyncio
async def test_premium_theme_blocked_for_free(client: AsyncClient):
    r = await client.put("/preferences", json={"theme": "midnight"})
    assert r.status_code == 403
    assert "Premium" in r.json()["detail"]


@pytest.mark.asyncio
async def test_premium_theme_allowed_for_premium(premium_client: AsyncClient):
    r = await premium_client.put("/preferences", json={"theme": "midnight"})
    assert r.status_code == 200
    assert r.json()["theme"] == "midnight"


@pytest.mark.asyncio
async def test_dark_theme_allowed_for_free(client: AsyncClient):
    """The default 'dark' theme is free, so updating to it should work."""
    r = await client.put("/preferences", json={"theme": "dark"})
    assert r.status_code == 200
    assert r.json()["theme"] == "dark"
