from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import ImportCacheEntry, ImportMap, PackageDir
from datetime import datetime, timezone

class ImportCacheService:
    def __init__(self, db: Session):
        self.db = db

    def list_entries(
        self,
        specifier: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ImportCacheEntry]:
        query = self.db.query(ImportCacheEntry)
        if specifier:
            query = query.filter(ImportCacheEntry.specifier.ilike(f"%{specifier}%"))
        if status:
            query = query.filter(ImportCacheEntry.status == status)
        return query.order_by(ImportCacheEntry.updated_at.desc()).offset(offset).limit(limit).all()

    def get_entry(self, entry_id: int) -> Optional[ImportCacheEntry]:
        return self.db.query(ImportCacheEntry).filter(ImportCacheEntry.id == entry_id).first()

    def get_by_cache_key(self, cache_key: str) -> Optional[ImportCacheEntry]:
        return self.db.query(ImportCacheEntry).filter(ImportCacheEntry.cache_key == cache_key).first()

    def create_entry(
        self,
        specifier: str,
        cache_key: str,
        resolved_url: Optional[str] = None,
        status: str = "resolved",
        error_message: Optional[str] = None,
    ) -> ImportCacheEntry:
        entry = ImportCacheEntry(
            specifier=specifier,
            cache_key=cache_key,
            resolved_url=resolved_url,
            status=status,
            error_message=error_message,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def update_entry(self, entry_id: int, **kwargs) -> Optional[ImportCacheEntry]:
        entry = self.get_entry(entry_id)
        if not entry:
            return None
        for key, value in kwargs.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
        entry.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def invalidate_entry(self, entry_id: int) -> bool:
        entry = self.get_entry(entry_id)
        if not entry:
            return False
        entry.status = "invalidated"
        entry.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def invalidate_by_specifier(self, specifier: str) -> int:
        entries = self.db.query(ImportCacheEntry).filter(
            ImportCacheEntry.specifier == specifier,
            ImportCacheEntry.status != "invalidated",
        ).all()
        count = len(entries)
        for entry in entries:
            entry.status = "invalidated"
            entry.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return count

    def invalidate_all(self) -> int:
        entries = self.db.query(ImportCacheEntry).filter(
            ImportCacheEntry.status != "invalidated"
        ).all()
        count = len(entries)
        for entry in entries:
            entry.status = "invalidated"
            entry.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return count

    def get_stats(self) -> Dict[str, Any]:
        total = self.db.query(ImportCacheEntry).count()
        resolved = self.db.query(ImportCacheEntry).filter(ImportCacheEntry.status == "resolved").count()
        failed = self.db.query(ImportCacheEntry).filter(ImportCacheEntry.status == "failed").count()
        invalidated = self.db.query(ImportCacheEntry).filter(ImportCacheEntry.status == "invalidated").count()
        return {
            "total": total,
            "resolved": resolved,
            "failed": failed,
            "invalidated": invalidated,
        }


class PackageDirService:
    def __init__(self, db: Session):
        self.db = db

    def list_dirs(self, limit: int = 100, offset: int = 0) -> List[PackageDir]:
        return self.db.query(PackageDir).order_by(PackageDir.updated_at.desc()).offset(offset).limit(limit).all()

    def get_dir(self, dir_id: int) -> Optional[PackageDir]:
        return self.db.query(PackageDir).filter(PackageDir.id == dir_id).first()

    def get_by_name(self, name: str) -> Optional[PackageDir]:
        return self.db.query(PackageDir).filter(PackageDir.name == name).first()

    def get_by_path(self, path: str) -> Optional[PackageDir]:
        return self.db.query(PackageDir).filter(PackageDir.path == path).first()

    def create_dir(self, name: str, path: str, package_json: Optional[Dict[str, Any]] = None) -> PackageDir:
        import json
        package_dir = PackageDir(
            name=name,
            path=path,
            package_json=json.dumps(package_json) if package_json else None,
        )
        self.db.add(package_dir)
        self.db.commit()
        self.db.refresh(package_dir)
        return package_dir

    def update_dir(self, dir_id: int, **kwargs) -> Optional[PackageDir]:
        package_dir = self.get_dir(dir_id)
        if not package_dir:
            return None
        import json
        for key, value in kwargs.items():
            if key == "package_json" and value is not None:
                setattr(package_dir, key, json.dumps(value))
            elif hasattr(package_dir, key):
                setattr(package_dir, key, value)
        package_dir.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(package_dir)
        return package_dir

    def delete_dir(self, dir_id: int) -> bool:
        package_dir = self.get_dir(dir_id)
        if not package_dir:
            return False
        self.db.delete(package_dir)
        self.db.commit()
        return True

    def resolve_package_dir(self, specifier: str) -> Optional[PackageDir]:
        """
        Resolve a package directory by specifier (package name).
        This mimics Node.js package resolution logic.
        """
        # First try exact name match
        package_dir = self.get_by_name(specifier)
        if package_dir:
            return package_dir

        # Try scoped package match (e.g., @scope/package)
        if specifier.startswith("@"):
            package_dir = self.get_by_name(specifier)
            if package_dir:
                return package_dir

        return None


class ImportMapService:
    def __init__(self, db: Session):
        self.db = db

    def list_maps(self, limit: int = 100, offset: int = 0) -> List[ImportMap]:
        return self.db.query(ImportMap).order_by(ImportMap.updated_at.desc()).offset(offset).limit(limit).all()

    def get_map(self, map_id: int) -> Optional[ImportMap]:
        return self.db.query(ImportMap).filter(ImportMap.id == map_id).first()

    def get_by_name(self, name: str) -> Optional[ImportMap]:
        return self.db.query(ImportMap).filter(ImportMap.name == name).first()

    def create_map(self, name: str, imports: Dict[str, str], scopes: Optional[Dict[str, Dict[str, str]]] = None) -> ImportMap:
        import json
        import_map = ImportMap(
            name=name,
            imports=json.dumps(imports),
            scopes=json.dumps(scopes) if scopes else None,
        )
        self.db.add(import_map)
        self.db.commit()
        self.db.refresh(import_map)
        return import_map

    def update_map(self, map_id: int, **kwargs) -> Optional[ImportMap]:
        import_map = self.get_map(map_id)
        if not import_map:
            return None
        import json
        for key, value in kwargs.items():
            if key in ("imports", "scopes") and value is not None:
                setattr(import_map, key, json.dumps(value))
            elif hasattr(import_map, key):
                setattr(import_map, key, value)
        import_map.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(import_map)
        return import_map

    def delete_map(self, map_id: int) -> bool:
        import_map = self.get_map(map_id)
        if not import_map:
            return False
        self.db.delete(import_map)
        self.db.commit()
        return True