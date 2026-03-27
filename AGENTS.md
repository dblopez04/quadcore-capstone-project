# Agent Guide

This repo is worked on by multiple coding agents and humans. Use this file to keep
changes consistent and reduce handoff friction.

## Read First
- `docs/PROJECT_OVERVIEW.md` for architecture and current behavior.
- `docs/AREAS.md` for ownership and file map.
- `docs/RUNBOOK.md` for local dev commands and service ports.

## Working Rules
- Keep changes scoped to one area unless the task explicitly needs cross-area work.
- Prefer small, reviewable diffs; explain tradeoffs and assumptions.
- Follow existing patterns in each area (React pages/components, Express controllers/routes, SQL in `database/init.sql`).
- Do not commit secrets; keep `.env` local and update `.env.example` if needed.
- If you skip tests, say why and note risk.
- When behavior or schema changes, update the relevant area docs and add a decision entry when needed.

## Documentation Upkeep
- Update docs when behavior changes, not just when code compiles.
- Record schema, API contract, or architectural changes in the relevant area doc or handoff.
- Update area docs (`docs/FRONTEND.md`, `docs/BACKEND.md`, `docs/DATABASE.md`, `docs/MAP.md`) when you touch those domains.

## Area-Specific Checklists

### Frontend
- Update routes in `frontend/src/main.jsx`.
- Keep API calls in `frontend/src/api/`.
- Use theme tokens from `frontend/src/index.css` for colors and spacing.

### Backend
- Add routes in `backend/app/routes/` with matching controllers.
- Keep auth-protected routes behind `verifyToken` middleware.
- Document endpoints with Swagger comments in route files.

### Database
- Update `database/init.sql` for schema changes.
- Call out breaking changes in the relevant area doc or handoff.

### Map
- Map data and OSRM artifacts live in `osrm-data/`.
- Regenerating OSRM files is destructive; see `docs/MAP.md`.

## Handoff Expectations
- Use `docs/HANDOFF_TEMPLATE.md` for handoffs.
- Include goal, changes, tests, risks, and open questions.
- Add next steps if the task is incomplete.
