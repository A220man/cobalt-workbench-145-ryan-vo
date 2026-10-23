# Changelog

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-23

### Added
- FastAPI backend with SQLite persistence
- React + TypeScript + Vite frontend
- Import cache management API (CRUD, invalidation, stats)
- Import maps API (CRUD with scopes support)
- Dashboard UI with cache entry table and import maps panel
- Dockerfiles for backend and frontend
- Docker Compose for local development
- Backend tests (pytest): 15 API tests, 9 service tests, 4 model tests
- Frontend tests (vitest): Dashboard, StatusBadge, StatCard
- README with architecture diagram and API reference
- MIT License

### Technical Details
- Backend: FastAPI 0.115, SQLAlchemy 2.0, Pydantic 2.9
- Frontend: React 18, TypeScript 5.6, Vite 5, Vitest 2.1
- Database: SQLite with automatic schema creation
- Container: Non-root users, health checks