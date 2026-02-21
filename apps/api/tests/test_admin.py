import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_custom_exercises_empty(admin_client: AsyncClient):
    r = await admin_client.get("/admin/custom-exercises")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_admin_custom_exercises_grouped(admin_client: AsyncClient):
    """Admin can see all custom exercises grouped by name+muscle with user counts."""
    r1 = await admin_client.post("/exercises", json={"id": "custom_1001", "name": "Hip Dip", "muscle": "Legs"})
    assert r1.status_code == 201
    r2 = await admin_client.post("/exercises", json={"id": "custom_1002", "name": "Pallof Press", "muscle": "Abs"})
    assert r2.status_code == 201

    r = await admin_client.get("/admin/custom-exercises")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    names = {row["name"] for row in data}
    assert names == {"Hip Dip", "Pallof Press"}
    for row in data:
        assert row["user_count"] == 1
        assert "muscle" in row


@pytest.mark.asyncio
async def test_admin_custom_exercises_ordered_by_popularity(admin_client: AsyncClient):
    """Exercises are returned in descending user_count order."""
    r1 = await admin_client.post("/exercises", json={"id": "custom_2001", "name": "Hip Dip", "muscle": "Legs"})
    assert r1.status_code == 201
    r2 = await admin_client.post("/exercises", json={"id": "custom_2002", "name": "Step Up", "muscle": "Legs"})
    assert r2.status_code == 201

    r = await admin_client.get("/admin/custom-exercises")
    assert r.status_code == 200
    data = r.json()
    names = [row["name"] for row in data]
    assert "Hip Dip" in names
    assert "Step Up" in names


@pytest.mark.asyncio
async def test_admin_custom_exercises_forbidden_for_free(client: AsyncClient):
    r = await client.get("/admin/custom-exercises")
    assert r.status_code == 403
