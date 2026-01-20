# Area Map

Use this file to route tasks and reviews to the right owner.

## Areas

| Area | Primary Paths | Key Files | Notes |
| --- | --- | --- | --- |
| Frontend | `frontend/` | `frontend/src/main.jsx`, `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/MapView.jsx`, `frontend/src/api/auth.js` | React + Vite UI, Leaflet map |
| Backend | `backend/` | `backend/server.js`, `backend/app/routes/`, `backend/app/controllers/`, `backend/app/middleware/`, `backend/app/models/` | Express API, auth, swagger |
| Database | `database/` | `database/init.sql` | Postgres + PostGIS schema |
| Map | `osrm-data/`, `compose.yaml` | `osrm-data/map.osm`, `compose.yaml` | OSRM routing data + container config |

## Area Docs
- Frontend: `docs/FRONTEND.md`
- Backend: `docs/BACKEND.md`
- Database: `docs/DATABASE.md`
- Map: `docs/MAP.md`

### Frontend
- Implement page flows for login, register, map, search, bookmarks, settings, and help.
- Build map UI with Leaflet and wire in route/POI data from the backend.
- Keep layouts mobile-first and aligned to UNT branding (colors, typography).

### Backend
- Provide REST APIs for auth, user profile, search history, and map data.
- Integrate OSRM routing and expose route + directions endpoints.
- Enforce role-based access (student/faculty/visitor/admin) and admin features.

### Database
- Maintain the Postgres/PostGIS schema and geospatial constraints.
- Add tables for POIs, events, reports, closures, bookmarks, and routing metadata.
- Document schema changes in `docs/DECISIONS.md`.

### Map
- Manage OSM extract updates and OSRM graph rebuilds.
- Define routing profiles and weights for accessibility and safety.
- Provide datasets for well-lit paths, accessible entrances, and closures.

## Ownership
- Frontend: @
- Backend: @
- Database: @
- Map: @

## Cross-Area Changes
- If a change touches multiple areas, note it in the PR description and handoff.
- Prefer separate, sequential PRs when possible to keep diffs reviewable.
- Update `docs/DECISIONS.md` when behavior or schema changes.
