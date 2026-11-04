from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator, computed_field, model_validator
from app.core.database import get_db
from app.services import ImportCacheService, ImportMapService, PackageDirService
from app.models import ImportCacheEntry, ImportMap, PackageDir
from datetime import datetime


# Pydantic schemas
class ImportCacheEntryBase(BaseModel):
    specifier: str
    cache_key: str
    resolved_url: Optional[str] = None
    status: str = "resolved"
    error_message: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"resolved", "failed", "invalidated"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v


class ImportCacheEntryCreate(ImportCacheEntryBase):
    pass


class ImportCacheEntryUpdate(BaseModel):
    resolved_url: Optional[str] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
    access_count: Optional[int] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"resolved", "failed", "invalidated"}
            if v not in allowed:
                raise ValueError(f"Status must be one of {allowed}")
        return v


class ImportCacheEntryResponse(ImportCacheEntryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    access_count: int

    class Config:
        from_attributes = True


class ImportCacheStats(BaseModel):
    total: int
    resolved: int
    failed: int
    invalidated: int


class ImportMapCreate(BaseModel):
    name: str
    imports: Dict[str, str]
    scopes: Optional[Dict[str, Dict[str, str]]] = None


class ImportMapUpdate(BaseModel):
    imports: Optional[Dict[str, str]] = None
    scopes: Optional[Dict[str, Dict[str, str]]] = None


class ImportMapResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    imports: Dict[str, str]
    scopes: Optional[Dict[str, Dict[str, str]]] = None

    @model_validator(mode='before')
    @classmethod
    def parse_json_fields(cls, data):
        if isinstance(data, ImportMap):
            if hasattr(data, 'imports_dict'):
                data = {
                    'id': data.id,
                    'name': data.name,
                    'created_at': data.created_at,
                    'updated_at': data.updated_at,
                    'imports': data.imports_dict,
                    'scopes': data.scopes_dict,
                }
        elif isinstance(data, dict):
            if 'imports' in data and isinstance(data['imports'], str):
                import json
                data['imports'] = json.loads(data['imports'])
            if 'scopes' in data and isinstance(data['scopes'], str):
                import json
                data['scopes'] = json.loads(data['scopes'])
        return data

    class Config:
        from_attributes = True


# Routers
router = APIRouter(prefix="/api/import-cache", tags=["import-cache"])


@router.get("", response_model=List[ImportCacheEntryResponse])
def list_cache_entries(
    specifier: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    service = ImportCacheService(db)
    entries = service.list_entries(specifier=specifier, status=status, limit=limit, offset=offset)
    return entries


@router.get("/stats", response_model=ImportCacheStats)
def get_cache_stats(db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    return service.get_stats()


@router.get("/{entry_id}", response_model=ImportCacheEntryResponse)
def get_cache_entry(entry_id: int, db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    entry = service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    return entry


@router.post("", response_model=ImportCacheEntryResponse, status_code=status.HTTP_201_CREATED)
def create_cache_entry(entry: ImportCacheEntryCreate, db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    existing = service.get_by_cache_key(entry.cache_key)
    if existing:
        raise HTTPException(status_code=409, detail="Cache key already exists")
    return service.create_entry(**entry.model_dump())


@router.patch("/{entry_id}", response_model=ImportCacheEntryResponse)
def update_cache_entry(entry_id: int, entry: ImportCacheEntryUpdate, db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    updated = service.update_entry(entry_id, **entry.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    return updated


@router.post("/{entry_id}/invalidate", response_model=ImportCacheEntryResponse)
def invalidate_cache_entry(entry_id: int, db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    entry = service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    service.invalidate_entry(entry_id)
    return service.get_entry(entry_id)


@router.post("/invalidate-by-specifier/{specifier}", response_model=dict)
def invalidate_by_specifier(specifier: str, db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    count = service.invalidate_by_specifier(specifier)
    return {"invalidated_count": count, "specifier": specifier}


@router.post("/invalidate-all", response_model=dict)
def invalidate_all(db: Session = Depends(get_db)):
    service = ImportCacheService(db)
    count = service.invalidate_all()
    return {"invalidated_count": count}


# Import Maps Router
maps_router = APIRouter(prefix="/api/import-maps", tags=["import-maps"])


@maps_router.get("", response_model=List[ImportMapResponse])
def list_import_maps(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    service = ImportMapService(db)
    return service.list_maps(limit=limit, offset=offset)


@maps_router.get("/{map_id}", response_model=ImportMapResponse)
def get_import_map(map_id: int, db: Session = Depends(get_db)):
    service = ImportMapService(db)
    import_map = service.get_map(map_id)
    if not import_map:
        raise HTTPException(status_code=404, detail="Import map not found")
    return import_map


@maps_router.post("", response_model=ImportMapResponse, status_code=status.HTTP_201_CREATED)
def create_import_map(import_map: ImportMapCreate, db: Session = Depends(get_db)):
    service = ImportMapService(db)
    existing = service.get_by_name(import_map.name)
    if existing:
        raise HTTPException(status_code=409, detail="Import map name already exists")
    return service.create_map(import_map.name, import_map.imports, import_map.scopes)


@maps_router.patch("/{map_id}", response_model=ImportMapResponse)
def update_import_map(map_id: int, import_map: ImportMapUpdate, db: Session = Depends(get_db)):
    service = ImportMapService(db)
    updated = service.update_map(map_id, **import_map.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Import map not found")
    return updated


@maps_router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_import_map(map_id: int, db: Session = Depends(get_db)):
    service = ImportMapService(db)
    if not service.delete_map(map_id):
        raise HTTPException(status_code=404, detail="Import map not found")
# Package Dir Schemas
class PackageDirCreate(BaseModel):
    name: str
    path: str
    package_json: Optional[Dict[str, Any]] = None


class PackageDirUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    package_json: Optional[Dict[str, Any]] = None


class PackageDirResponse(BaseModel):
    id: int
    name: str
    path: str
    package_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode='before')
    @classmethod
    def parse_json_fields(cls, data):
        if isinstance(data, PackageDir):
            if hasattr(data, 'package_json_dict'):
                data = {
                    'id': data.id,
                    'name': data.name,
                    'path': data.path,
                    'package_json': data.package_json_dict,
                    'created_at': data.created_at,
                    'updated_at': data.updated_at,
                }
        elif isinstance(data, dict):
            if 'package_json' in data and isinstance(data['package_json'], str):
                import json
                data['package_json'] = json.loads(data['package_json'])
        return data

    class Config:
        from_attributes = True


class PackageDirResolveResponse(BaseModel):
    specifier: str
    package_dir: Optional[PackageDirResponse] = None
    resolved: bool


# Package Dir Router
dirs_router = APIRouter(prefix="/api/package-dirs", tags=["package-dirs"])


@dirs_router.get("", response_model=List[PackageDirResponse])
def list_package_dirs(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    service = PackageDirService(db)
    return service.list_dirs(limit=limit, offset=offset)


@dirs_router.get("/resolve", response_model=PackageDirResolveResponse)
def resolve_package_dir(specifier: str = Query(..., description="Package specifier to resolve"), db: Session = Depends(get_db)):
    service = PackageDirService(db)
    package_dir = service.resolve_package_dir(specifier)
    return PackageDirResolveResponse(
        specifier=specifier,
        package_dir=package_dir,
        resolved=package_dir is not None,
    )


@dirs_router.get("/{dir_id}", response_model=PackageDirResponse)
def get_package_dir(dir_id: int, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    package_dir = service.get_dir(dir_id)
    if not package_dir:
        raise HTTPException(status_code=404, detail="Package directory not found")
    return package_dir


@dirs_router.get("/by-name/{name}", response_model=PackageDirResponse)
def get_package_dir_by_name(name: str, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    package_dir = service.get_by_name(name)
    if not package_dir:
        raise HTTPException(status_code=404, detail="Package directory not found")
    return package_dir
@dirs_router.get("/by-path/{path:path}", response_model=PackageDirResponse)
def get_package_dir_by_path(path: str, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    package_dir = service.get_by_path(path)
    if not package_dir:
        raise HTTPException(status_code=404, detail="Package directory not found")
    return package_dir


@dirs_router.post("", response_model=PackageDirResponse, status_code=status.HTTP_201_CREATED)
def create_package_dir(package_dir: PackageDirCreate, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    existing = service.get_by_name(package_dir.name)
    if existing:
        raise HTTPException(status_code=409, detail="Package directory name already exists")
    existing_path = service.get_by_path(package_dir.path)
    if existing_path:
        raise HTTPException(status_code=409, detail="Package directory path already exists")
    return service.create_dir(package_dir.name, package_dir.path, package_dir.package_json)


@dirs_router.patch("/{dir_id}", response_model=PackageDirResponse)
def update_package_dir(dir_id: int, package_dir: PackageDirUpdate, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    updated = service.update_dir(dir_id, **package_dir.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Package directory not found")
    return updated


@dirs_router.delete("/{dir_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_package_dir(dir_id: int, db: Session = Depends(get_db)):
    service = PackageDirService(db)
    if not service.delete_dir(dir_id):
        raise HTTPException(status_code=404, detail="Package directory not found")

