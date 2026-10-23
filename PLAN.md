# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

skeleton-and-cache-api

## Roadmap

### skeleton-and-cache-api — FastAPI/React skeleton with ESM cache invalidation API

Status: done

Acceptance:
- FastAPI backend runs with SQLite persistence
- React + TypeScript + Vite frontend builds and runs
- Backend exposes /api/import-cache endpoints (list, invalidate, stats)
- Frontend dashboard shows cache entries and can invalidate them
- Dockerfiles and compose.yaml for local development
- Backend tests (pytest) and frontend tests (vitest) pass
- README with install/run/test steps

Implementation: `backend/app/main.py`, `backend/app/api/__init__.py`, `backend/app/services/__init__.py`, `backend/app/models/__init__.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `frontend/src/components/Dashboard.tsx`, `frontend/src/components/CacheEntryTable.tsx`, `frontend/src/components/ImportMapsPanel.tsx`, `frontend/src/components/StatCard.tsx`, `frontend/src/components/StatusBadge.tsx`, `frontend/src/hooks/useImportCache.ts`, `frontend/src/hooks/useImportMaps.ts`, `frontend/src/api/client.ts`, `frontend/src/types/index.ts`, `frontend/src/main.tsx`, `frontend/src/index.css`, `compose.yaml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`

Tests: `backend/tests/test_api.py`, `backend/tests/test_services.py`, `backend/tests/test_models.py`, `frontend/src/test/Dashboard.test.tsx`, `frontend/src/test/StatCard.test.tsx`, `frontend/src/test/StatusBadge.test.tsx`

### import-maps-support — Import maps configuration and resolution

Status: planned

Acceptance:
- Backend stores import map configurations
- API to create/read/update/delete import maps
- Frontend UI to manage import maps

### package-dir-api — Package directory resolution API

Status: planned

Acceptance:
- Backend resolves package root directories
- API endpoint for package dir lookup
- Frontend integration

### typescript-transpile-node-modules — TypeScript transpilation for node_modules workflow

Status: planned

Acceptance:
- Configuration for transpile packages
- Backend manages transpilation settings
- Frontend configuration UI

### structured-logging — Structured logging integration

Status: planned

Acceptance:
- Backend structured logging with JSON output
- Frontend log viewer
- Configurable log levels

### env-file-support — .env file management

Status: planned

Acceptance:
- Backend parses and manages .env files
- API for env file CRUD
- Frontend env editor

### async-iteration-performance — Async iteration performance analyzer

Status: planned

Acceptance:
- Backend benchmarks async iteration patterns
- API to run/compare benchmarks
- Frontend results visualization

