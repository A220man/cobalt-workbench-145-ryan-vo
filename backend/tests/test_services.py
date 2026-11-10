import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, ImportCacheEntry, ImportMap, PackageDir
from app.services import ImportCacheService, ImportMapService, PackageDirService


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_services.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestImportCacheService:
    def test_create_and_get_entry(self, db):
        service = ImportCacheService(db)
        entry = service.create_entry("lodash", "lodash@4.17.21", "file:///path/lodash.js", "resolved")
        assert entry.id == 1
        assert entry.specifier == "lodash"
        assert entry.cache_key == "lodash@4.17.21"
        assert entry.status == "resolved"

        fetched = service.get_entry(entry.id)
        assert fetched is not None
        assert fetched.specifier == "lodash"

    def test_get_by_cache_key(self, db):
        service = ImportCacheService(db)
        service.create_entry("react", "react@18.2.0", "file:///path/react.js", "resolved")

        entry = service.get_by_cache_key("react@18.2.0")
        assert entry is not None
        assert entry.specifier == "react"

        not_found = service.get_by_cache_key("nonexistent")
        assert not_found is None

    def test_list_entries(self, db):
        service = ImportCacheService(db)
        service.create_entry("a", "a@1", status="resolved")
        service.create_entry("b", "b@1", status="failed")
        service.create_entry("c", "c@1", status="invalidated")

        all_entries = service.list_entries()
        assert len(all_entries) == 3

        resolved = service.list_entries(status="resolved")
        assert len(resolved) == 1
        assert resolved[0].specifier == "a"

    def test_update_entry(self, db):
        service = ImportCacheService(db)
        entry = service.create_entry("vue", "vue@3.4.0", status="resolved")

        updated = service.update_entry(entry.id, access_count=10, status="failed")
        assert updated is not None
        assert updated.access_count == 10
        assert updated.status == "failed"

        not_updated = service.update_entry(999, access_count=5)
        assert not_updated is None

    def test_invalidate_entry(self, db):
        service = ImportCacheService(db)
        entry = service.create_entry("angular", "angular@18.0.0", status="resolved")

        result = service.invalidate_entry(entry.id)
        assert result is True

        invalidated = service.get_entry(entry.id)
        assert invalidated.status == "invalidated"

        result_false = service.invalidate_entry(999)
        assert result_false is False

    def test_invalidate_by_specifier(self, db):
        service = ImportCacheService(db)
        service.create_entry("svelte", "svelte@4.0.0", status="resolved")
        service.create_entry("svelte", "svelte@4.0.1", status="resolved")
        service.create_entry("solid", "solid@1.8.0", status="resolved")

        count = service.invalidate_by_specifier("svelte")
        assert count == 2

        svelte_entries = service.list_entries(specifier="svelte")
        for e in svelte_entries:
            assert e.status == "invalidated"

        solid_entries = service.list_entries(specifier="solid")
        assert solid_entries[0].status == "resolved"

    def test_invalidate_all(self, db):
        service = ImportCacheService(db)
        service.create_entry("a", "a@1", status="resolved")
        service.create_entry("b", "b@1", status="resolved")
        service.create_entry("c", "c@1", status="failed")

        count = service.invalidate_all()
        assert count == 3

        all_entries = service.list_entries()
        for e in all_entries:
            assert e.status == "invalidated"

    def test_get_stats(self, db):
        service = ImportCacheService(db)
        service.create_entry("a", "a@1", status="resolved")
        service.create_entry("b", "b@1", status="resolved")
        service.create_entry("c", "c@1", status="failed")
        service.create_entry("d", "d@1", status="invalidated")

        stats = service.get_stats()
        assert stats["total"] == 4
        assert stats["resolved"] == 2
        assert stats["failed"] == 1
        assert stats["invalidated"] == 1


class TestImportMapService:
    def test_create_and_get_map(self, db):
        service = ImportMapService(db)
        import_map = service.create_map("test", {"lodash": "path/to/lodash.js"})

        assert import_map.id == 1
        assert import_map.name == "test"
        assert import_map.imports == '{"lodash": "path/to/lodash.js"}'

        fetched = service.get_map(import_map.id)
        assert fetched is not None
        assert fetched.name == "test"

    def test_get_by_name(self, db):
        service = ImportMapService(db)
        service.create_map("byname", {"a": "b"})

        found = service.get_by_name("byname")
        assert found is not None
        assert found.name == "byname"

        not_found = service.get_by_name("nonexistent")
        assert not_found is None

    def test_list_maps(self, db):
        service = ImportMapService(db)
        service.create_map("map1", {})
        service.create_map("map2", {})

        maps = service.list_maps()
        assert len(maps) == 2

    def test_update_map(self, db):
        service = ImportMapService(db)
        import_map = service.create_map("update-test", {"old": "value"})

        updated = service.update_map(import_map.id, imports={"new": "value"})
        assert updated is not None
        assert updated.imports == '{"new": "value"}'

        not_updated = service.update_map(999, imports={"x": "y"})
        assert not_updated is None

    def test_delete_map(self, db):
        service = ImportMapService(db)
        import_map = service.create_map("delete-test", {})

        result = service.delete_map(import_map.id)
        assert result is True

        deleted = service.get_map(import_map.id)
        assert deleted is None

        result_false = service.delete_map(999)
        assert result_false is False

    def test_create_with_scopes(self, db):
        service = ImportMapService(db)
        import_map = service.create_map(
            "with-scopes",
            {"pkg": "path/pkg.js"},
            {"path/pkg": {"sub": "path/sub.js"}}
        )

        assert import_map.scopes is not None


class TestPackageDirService:
    def test_create_and_get_dir(self, db):
        service = PackageDirService(db)
        package_dir = service.create_dir("test-pkg", "/path/test-pkg", {"name": "test-pkg", "version": "1.0.0"})

        assert package_dir.id is not None
        assert package_dir.name == "test-pkg"
        assert package_dir.path == "/path/test-pkg"
        assert package_dir.package_json_dict["name"] == "test-pkg"

        fetched = service.get_dir(package_dir.id)
        assert fetched is not None
        assert fetched.name == "test-pkg"
        assert fetched.path == "/path/test-pkg"

    def test_get_by_name(self, db):
        service = PackageDirService(db)
        service.create_dir("by-name", "/path/by-name")

        found = service.get_by_name("by-name")
        assert found is not None
        assert found.name == "by-name"

        not_found = service.get_by_name("nonexistent")
        assert not_found is None

    def test_get_by_path(self, db):
        service = PackageDirService(db)
        service.create_dir("by-path", "/path/by-path")

        found = service.get_by_path("/path/by-path")
        assert found is not None
        assert found.path == "/path/by-path"

        not_found = service.get_by_path("/path/nonexistent")
        assert not_found is None

    def test_list_dirs(self, db):
        service = PackageDirService(db)
        service.create_dir("pkg1", "/path/pkg1")
        service.create_dir("pkg2", "/path/pkg2")
        service.create_dir("pkg3", "/path/pkg3")

        dirs = service.list_dirs(limit=10, offset=0)
        assert len(dirs) == 3
        assert dirs[0].name == "pkg1"
        assert dirs[2].name == "pkg3"

        page2 = service.list_dirs(limit=2, offset=1)
        assert len(page2) == 2
        assert page2[0].name == "pkg2"

    def test_update_dir(self, db):
        service = PackageDirService(db)
        package_dir = service.create_dir("update-pkg", "/path/update")

        updated = service.update_dir(package_dir.id, name="updated-name")
        assert updated is not None
        assert updated.name == "updated-name"
        assert updated.path == "/path/update"

        not_updated = service.update_dir(999, name="ghost")
        assert not_updated is None

    def test_update_dir_package_json(self, db):
        service = PackageDirService(db)
        package_dir = service.create_dir("json-pkg", "/path/json", {"version": "1.0.0"})

        updated = service.update_dir(package_dir.id, package_json={"version": "2.0.0", "main": "index.js"})
        assert updated is not None
        assert updated.package_json_dict["version"] == "2.0.0"
        assert updated.package_json_dict["main"] == "index.js"

    def test_delete_dir(self, db):
        service = PackageDirService(db)
        package_dir = service.create_dir("delete-pkg", "/path/delete")

        result = service.delete_dir(package_dir.id)
        assert result is True

        deleted = service.get_dir(package_dir.id)
        assert deleted is None

        result_false = service.delete_dir(999)
        assert result_false is False

    def test_resolve_package_dir(self, db):
        service = PackageDirService(db)
        service.create_dir("resolve-pkg", "/path/resolve-pkg")

        resolved = service.resolve_package_dir("resolve-pkg")
        assert resolved is not None
        assert resolved.name == "resolve-pkg"

        not_resolved = service.resolve_package_dir("nonexistent")
        assert not_resolved is None

    def test_resolve_scoped_package_dir(self, db):
        service = PackageDirService(db)
        service.create_dir("@scope/pkg", "/path/scoped-pkg")

        resolved = service.resolve_package_dir("@scope/pkg")
        assert resolved is not None
        assert resolved.name == "@scope/pkg"

        not_resolved = service.resolve_package_dir("@other/pkg")
        assert not_resolved is None