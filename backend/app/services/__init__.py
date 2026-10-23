from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import ImportCacheEntry, ImportMap
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