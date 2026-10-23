import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, ImportCacheEntry, ImportMap


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_models.db"

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


class TestImportCacheEntryModel:
    def test_create_entry(self, db):
        entry = ImportCacheEntry(
            specifier="test-pkg",
            cache_key="test-pkg@1.0.0",
            resolved_url="file:///path/test-pkg.js",
            status="resolved",
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        assert entry.id is not None
        assert entry.specifier == "test-pkg"
        assert entry.cache_key == "test-pkg@1.0.0"
        assert entry.resolved_url == "file:///path/test-pkg.js"
        assert entry.status == "resolved"
        assert entry.access_count == 0
        assert entry.created_at is not None
        assert entry.updated_at is not None

    def test_default_values(self, db):
        entry = ImportCacheEntry(specifier="default", cache_key="default@1")
        db.add(entry)
        db.commit()
        db.refresh(entry)

        assert entry.status == "resolved"
        assert entry.access_count == 0
        assert entry.error_message is None
        assert entry.resolved_url is None

    def test_unique_cache_key_not_enforced_by_model(self, db):
        entry1 = ImportCacheEntry(specifier="a", cache_key="dup@1")
        entry2 = ImportCacheEntry(specifier="b", cache_key="dup@1")
        db.add(entry1)
        db.add(entry2)
        db.commit()

        assert entry1.id != entry2.id


class TestImportMapModel:
    def test_create_map(self, db):
        import_map = ImportMap(
            name="test-map",
            imports='{"pkg": "path/to/pkg.js"}',
        )
        db.add(import_map)
        db.commit()
        db.refresh(import_map)

        assert import_map.id is not None
        assert import_map.name == "test-map"
        assert import_map.imports == '{"pkg": "path/to/pkg.js"}'
        assert import_map.scopes is None
        assert import_map.created_at is not None
        assert import_map.updated_at is not None

    def test_create_map_with_scopes(self, db):
        import_map = ImportMap(
            name="scoped-map",
            imports='{"pkg": "path/to/pkg.js"}',
            scopes='{"path/to/pkg": {"sub": "path/to/sub.js"}}',
        )
        db.add(import_map)
        db.commit()
        db.refresh(import_map)

        assert import_map.scopes == '{"path/to/pkg": {"sub": "path/to/sub.js"}}'

    def test_unique_name_enforced(self, db):
        import_map1 = ImportMap(name="unique", imports="{}")
        import_map2 = ImportMap(name="unique", imports="{}")
        db.add(import_map1)
        db.commit()

        with pytest.raises(Exception):
            db.add(import_map2)
            db.commit()