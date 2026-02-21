import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_routines_empty(client: AsyncClient):
    r = await client.get("/routines")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_routine(client: AsyncClient):
    payload = {"name": "Push Day", "exercises": ["bench_press", "overhead_press"]}
    r = await client.post("/routines", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Push Day"
    assert data["exercises"] == ["bench_press", "overhead_press"]
    assert "id" in data


@pytest.mark.asyncio
async def test_create_and_list(client: AsyncClient):
    await client.post("/routines", json={"name": "Leg Day", "exercises": []})
    await client.post("/routines", json={"name": "Pull Day", "exercises": []})

    r = await client.get("/routines")
    assert r.status_code == 200
    names = {row["name"] for row in r.json()}
    assert "Leg Day" in names
    assert "Pull Day" in names


@pytest.mark.asyncio
async def test_update_routine(client: AsyncClient):
    r = await client.post("/routines", json={"name": "Old Name", "exercises": []})
    routine_id = r.json()["id"]

    r = await client.put(f"/routines/{routine_id}", json={"name": "New Name"})
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_routine(client: AsyncClient):
    r = await client.post("/routines", json={"name": "Temp", "exercises": []})
    routine_id = r.json()["id"]

    r = await client.delete(f"/routines/{routine_id}")
    assert r.status_code == 204

    r = await client.get("/routines")
    assert all(row["id"] != routine_id for row in r.json())


@pytest.mark.asyncio
async def test_delete_nonexistent_returns_404(client: AsyncClient):
    r = await client.delete("/routines/does-not-exist")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_free_tier_limit(client: AsyncClient):
    """Free users can create at most 3 routines."""
    for i in range(3):
        r = await client.post("/routines", json={"name": f"Routine {i}", "exercises": []})
        assert r.status_code == 201

    r = await client.post("/routines", json={"name": "Fourth Routine", "exercises": []})
    assert r.status_code == 403
    assert "3" in r.json()["detail"]


@pytest.mark.asyncio
async def test_premium_bypasses_routine_limit(premium_client: AsyncClient):
    """Premium users are not capped at 3 routines."""
    for i in range(4):
        r = await premium_client.post("/routines", json={"name": f"Routine {i}", "exercises": []})
        assert r.status_code == 201
