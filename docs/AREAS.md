# Area Map

Use this to keep changes scoped.

| Area | Scope | Primary Paths | Start Here |
| --- | --- | --- | --- |
| Frontend | UI, routes, API clients, styling | `frontend/` | `frontend/src/main.jsx`, `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/api/` |
| Backend | Express app, controllers, middleware, models | `backend/` | `backend/server.js`, `backend/app/routes/`, `backend/app/controllers/`, `backend/app/middleware/`, `backend/app/models/` |
| Database | Schema, seeds, manual migrations | `database/` | `database/init.sql`, `database/seed_*.sql`, `database/migration_*.sql` |
| Map | OSM extract, OSRM artifacts, import scripts | `osrm-data/`, repo root scripts | `osrm-data/map.osm`, `import_osm.sh`, `import_osm_macos.sh`, `compose.yaml` |

## Area Docs
- Frontend: `docs/FRONTEND.md`
- Backend: `docs/BACKEND.md`
- Database: `docs/DATABASE.md`
- Map: `docs/MAP.md`

## Cross-Area Rules
- Keep diffs inside one area unless the task clearly spans more.
- If schema or API behavior changes, update the affected area docs.
- If a change depends on another area, call it out in the handoff.
