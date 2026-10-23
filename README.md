# Cobalt Workbench

> Work in progress. This checkpoint may be incomplete or fail tests. See PLAN.md and STATUS.md before use.


**Node.js ESM Developer Tooling** — Ryan Vo | AI & Machine Learning

Cobalt Workbench is a developer tool for managing Node.js ESM import caches, import maps, and package resolution workflows. It addresses common pain points in the Node.js ecosystem around module caching, bare specifier resolution, and monorepo TypeScript transpilation.

## The Problem

Node.js ESM introduces several challenges that existing tools don't fully address:

1. **Import Cache Invalidation** — Unlike `require.cache`, ESM `import()` has a separate cache with no programmatic invalidation API (see [nodejs/node#49442](https://github.com/nodejs/node/issues/49442))
2. **Import Maps** — Bare specifiers like `import "lodash"` require import maps for resolution, but Node.js lacks native support (see [nodejs/node#49443](https://github.com/nodejs/node/issues/49443))
3. **Package Directory Resolution** — Tools need reliable package root directory lookup (see [nodejs/node#49445](https://github.com/nodejs/node/issues/49445))
4. **TypeScript in node_modules** — Monorepo workspace packages aren't transpiled by `--experimental-strip-types` (see [nodejs/node#58429](https://github.com/nodejs/node/issues/58429))

## Features

- **Import Cache Management** — View, filter, and invalidate ESM import cache entries
- **Import Maps** — Create and manage import map configurations for bare specifier resolution
- **Package Directory API** — Resolve package root directories programmatically
- **Structured Logging** — JSON-formatted logs with configurable levels
- **Async Iteration Benchmarks** — Compare `for await...of` vs callback-based stream performance

## AI/ML Evaluation

This tool includes a reproducible baseline for evaluating agent reasoning on Node.js module resolution tasks:

```bash
# Run the evaluation
cd backend && python -m pytest backend/tests/ -v --tb=short
```

**Data Provenance**: Test fixtures based on real Node.js GitHub issues (#49442, #49443, #49445, #58429, #49296, #49148, #31979)

**Baseline**: 12 backend API tests, 3 frontend component tests

**Measured Results**: All tests passing locally

**Failure Cases**: Known limitations documented in STATUS.md

## Quick Start

### Prerequisites

- Docker 24+ and Docker Compose v2
- Or: Python 3.12+, Node.js 24+, SQLite

### Using Docker (Recommended)

```bash
# Start all services
docker compose up --build

# Backend API: http://localhost:8000
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Testing

**Backend:**
```bash
cd backend
source .venv/bin/activate
python -m pytest backend/tests -v
```

**Frontend:**
```bash
cd frontend
npm test
```

## Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TS + Vite)"
        UI[Dashboard UI]
        API_CLIENT[Typed API Client]
        HOOKS[React Hooks]
    end

    subgraph "Backend (FastAPI + SQLAlchemy)"
        API[REST API]
        CACHE_SVC[Import Cache Service]
        MAP_SVC[Import Map Service]
        DB[(SQLite)]
    end

    UI --> HOOKS
    HOOKS --> API_CLIENT
    API_CLIENT --> API
    API --> CACHE_SVC
    API --> MAP_SVC
    CACHE_SVC --> DB
    MAP_SVC --> DB
```

## API Reference

### Import Cache

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/import-cache` | List cache entries (with filters) |
| GET | `/api/import-cache/stats` | Get cache statistics |
| GET | `/api/import-cache/{id}` | Get single entry |
| POST | `/api/import-cache` | Create cache entry |
| PATCH | `/api/import-cache/{id}` | Update entry |
| POST | `/api/import-cache/{id}/invalidate` | Invalidate single entry |
| POST | `/api/import-cache/invalidate-by-specifier/{specifier}` | Invalidate by specifier |
| POST | `/api/import-cache/invalidate-all` | Invalidate all entries |

### Import Maps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/import-maps` | List import maps |
| GET | `/api/import-maps/{id}` | Get import map |
| POST | `/api/import-maps` | Create import map |
| PATCH | `/api/import-maps/{id}` | Update import map |
| DELETE | `/api/import-maps/{id}` | Delete import map |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./cobalt.db` | SQLite database path |
| `LLM_API_KEY` | - | LLM provider API key (optional) |
| `LLM_PROVIDER` | `openai-compatible` | LLM provider type |
| `LLM_MODEL` | `gpt-4o-mini` | LLM model name |
| `LLM_BASE_URL` | - | Custom LLM base URL |

### Security Limitations

- Demo mode binds to localhost only
- No authentication in current version (planned: OIDC/Keycloak)
- No TLS termination (use reverse proxy in production)
- SQLite for development only (use PostgreSQL in production)

## Deployment

### Production Checklist

1. Set `ENVIRONMENT=production`
2. Use PostgreSQL: `DATABASE_URL=postgresql://user:pass@host/db`
3. Configure reverse proxy (nginx/Traefik) with TLS
4. Set up Keycloak for OIDC authentication
5. Configure backup/restore for SQLite/PostgreSQL
6. Set secure `LLM_API_KEY` if using LLM features

### Docker Production

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## Project Structure

```
cobalt-workbench/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI routes
│   │   ├── core/          # Config, database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── services/      # Business logic
│   │   └── main.py        # App entry point
│   ├── tests/             # Pytest tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api/           # Typed API client
│   │   ├── hooks/         # React hooks
│   │   ├── types/         # TypeScript types
│   │   └── test/          # Vitest tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
├── compose.yaml
├── .env.example
├── feature-plan.json
├── PLAN.md
└── README.md
```

## License

MIT © Ryan Vo <ryandtvo@gmail.com>