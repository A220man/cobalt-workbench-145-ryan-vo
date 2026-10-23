import json
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func
from app.core.database import Base


class ImportCacheEntry(Base):
    __tablename__ = "import_cache_entries"

    id = Column(Integer, primary_key=True, index=True)
    specifier = Column(String(500), nullable=False, index=True)
    resolved_url = Column(String(1000), nullable=True)
    cache_key = Column(String(500), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="resolved")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    access_count = Column(Integer, default=0)

    __table_args__ = (
        Index("ix_import_cache_specifier_status", "specifier", "status"),
    )


class ImportMap(Base):
    __tablename__ = "import_maps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True, index=True)
    imports = Column(Text, nullable=False)
    scopes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def imports_dict(self) -> dict:
        return json.loads(self.imports) if self.imports else {}

    @property
    def scopes_dict(self) -> dict:
        return json.loads(self.scopes) if self.scopes else {}