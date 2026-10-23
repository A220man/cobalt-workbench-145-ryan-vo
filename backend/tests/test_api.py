import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import create_app
from app.core.database import Base, get_db
from app.models import ImportCacheEntry, ImportMap


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestHealthCheck:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "cobalt-workbench"}


class TestImportCacheAPI:
    def test_list_empty_cache(self, client):
        response = client.get("/api/import-cache")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_stats_empty(self, client):
        response = client.get("/api/import-cache/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["resolved"] == 0
        assert data["failed"] == 0
        assert data["invalidated"] == 0

    def test_create_cache_entry(self, client):
        response = client.post(
            "/api/import-cache",
            json={
                "specifier": "lodash",
                "cache_key": "lodash@4.17.21",
                "resolved_url": "file:///node_modules/lodash/lodash.js",
                "status": "resolved",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["specifier"] == "lodash"
        assert data["cache_key"] == "lodash@4.17.21"
        assert data["status"] == "resolved"
        assert data["id"] == 1

    def test_create_duplicate_cache_key_fails(self, client):
        client.post(
            "/api/import-cache",
            json={
                "specifier": "lodash",
                "cache_key": "lodash@4.17.21",
                "status": "resolved",
            },
        )
        response = client.post(
            "/api/import-cache",
            json={
                "specifier": "lodash",
                "cache_key": "lodash@4.17.21",
                "status": "resolved",
            },
        )
        assert response.status_code == 409

    def test_get_cache_entry(self, client):
        create_resp = client.post(
            "/api/import-cache",
            json={"specifier": "react", "cache_key": "react@18.2.0", "status": "resolved"},
        )
        entry_id = create_resp.json()["id"]

        response = client.get(f"/api/import-cache/{entry_id}")
        assert response.status_code == 200
        assert response.json()["specifier"] == "react"

    def test_get_nonexistent_entry(self, client):
        response = client.get("/api/import-cache/999")
        assert response.status_code == 404

    def test_update_cache_entry(self, client):
        create_resp = client.post(
            "/api/import-cache",
            json={"specifier": "vue", "cache_key": "vue@3.4.0", "status": "resolved"},
        )
        entry_id = create_resp.json()["id"]

        response = client.patch(f"/api/import-cache/{entry_id}", json={"access_count": 5})
        assert response.status_code == 200
        assert response.json()["access_count"] == 5

    def test_invalidate_cache_entry(self, client):
        create_resp = client.post(
            "/api/import-cache",
            json={"specifier": "angular", "cache_key": "angular@18.0.0", "status": "resolved"},
        )
        entry_id = create_resp.json()["id"]

        response = client.post(f"/api/import-cache/{entry_id}/invalidate")
        assert response.status_code == 200
        assert response.json()["status"] == "invalidated"

    def test_invalidate_by_specifier(self, client):
        client.post("/api/import-cache", json={"specifier": "svelte", "cache_key": "svelte@4.0.0", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "svelte", "cache_key": "svelte@4.0.1", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "solid", "cache_key": "solid@1.8.0", "status": "resolved"})

        response = client.post("/api/import-cache/invalidate-by-specifier/svelte")
        assert response.status_code == 200
        assert response.json()["invalidated_count"] == 2

        list_resp = client.get("/api/import-cache?specifier=svelte")
        for entry in list_resp.json():
            assert entry["status"] == "invalidated"

    def test_invalidate_all(self, client):
        client.post("/api/import-cache", json={"specifier": "a", "cache_key": "a@1", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "b", "cache_key": "b@1", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "c", "cache_key": "c@1", "status": "failed"})

        response = client.post("/api/import-cache/invalidate-all")
        assert response.status_code == 200
        assert response.json()["invalidated_count"] == 3

        stats = client.get("/api/import-cache/stats").json()
        assert stats["invalidated"] == 3
        assert stats["resolved"] == 0

    def test_filter_by_status(self, client):
        client.post("/api/import-cache", json={"specifier": "x", "cache_key": "x@1", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "y", "cache_key": "y@1", "status": "failed"})
        client.post("/api/import-cache", json={"specifier": "z", "cache_key": "z@1", "status": "invalidated"})

        resolved = client.get("/api/import-cache?status=resolved").json()
        assert len(resolved) == 1
        assert resolved[0]["specifier"] == "x"

        failed = client.get("/api/import-cache?status=failed").json()
        assert len(failed) == 1
        assert failed[0]["specifier"] == "y"

    def test_filter_by_specifier(self, client):
        client.post("/api/import-cache", json={"specifier": "lodash", "cache_key": "lodash@1", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "lodash", "cache_key": "lodash@2", "status": "resolved"})
        client.post("/api/import-cache", json={"specifier": "react", "cache_key": "react@1", "status": "resolved"})

        lodash_entries = client.get("/api/import-cache?specifier=lodash").json()
        assert len(lodash_entries) == 2

    def test_pagination(self, client):
        for i in range(15):
            client.post("/api/import-cache", json={"specifier": f"pkg{i}", "cache_key": f"pkg{i}@1", "status": "resolved"})

        page1 = client.get("/api/import-cache?limit=10&offset=0").json()
        assert len(page1) == 10

        page2 = client.get("/api/import-cache?limit=10&offset=10").json()
        assert len(page2) == 5


class TestImportMapsAPI:
    def test_list_empty_import_maps(self, client):
        response = client.get("/api/import-maps")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_import_map(self, client):
        response = client.post(
            "/api/import-maps",
            json={
                "name": "test-map",
                "imports": {"lodash": "node_modules/lodash/lodash.js"},
                "scopes": {"node_modules/lodash": {"fp": "node_modules/lodash/fp.js"}},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test-map"
        assert data["imports"]["lodash"] == "node_modules/lodash/lodash.js"
        assert data["scopes"]["node_modules/lodash"]["fp"] == "node_modules/lodash/fp.js"

    def test_create_duplicate_name_fails(self, client):
        client.post("/api/import-maps", json={"name": "dup", "imports": {}})
        response = client.post("/api/import-maps", json={"name": "dup", "imports": {}})
        assert response.status_code == 409

    def test_get_import_map(self, client):
        create_resp = client.post("/api/import-maps", json={"name": "get-map", "imports": {"a": "b"}})
        map_id = create_resp.json()["id"]

        response = client.get(f"/api/import-maps/{map_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "get-map"

    def test_update_import_map(self, client):
        create_resp = client.post("/api/import-maps", json={"name": "update-map", "imports": {"old": "value"}})
        map_id = create_resp.json()["id"]

        response = client.patch(f"/api/import-maps/{map_id}", json={"imports": {"new": "value"}})
        assert response.status_code == 200
        assert response.json()["imports"]["new"] == "value"

    def test_delete_import_map(self, client):
        create_resp = client.post("/api/import-maps", json={"name": "delete-map", "imports": {}})
        map_id = create_resp.json()["id"]

        response = client.delete(f"/api/import-maps/{map_id}")
        assert response.status_code == 204

        get_resp = client.get(f"/api/import-maps/{map_id}")
        assert get_resp.status_code == 404