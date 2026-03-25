# Project Overview

## Goal
Build a campus navigation app for the University of North Texas. The app surfaces
campus locations on a map, supports user accounts, and provides navigation,
accessibility, and safety features tailored to UNT.

## Target Users
- Students, faculty, and visitors navigating campus.
- Admin users who manage POIs, closures, and events.

## Requirements Snapshot
- Interactive map with campus POIs (buildings, dining, parking, bus stops).
- Search, filters, and user-specific access (student/faculty/visitor).
- Routing, turn-by-turn navigation, walking ETA, and GPS location.
- Bookmarks, search history, and user reporting for closures.
- Accessibility and safety options (ramps, elevators, well-lit paths).
- Mobile-first UI with consistent branding and reusable components.

## Release Roadmap (from `requirements.md`)
- R1: map render, POIs, location search, current location, register, login.
- R2: routing, turn-by-turn, bookmarks, search history, POI filtering, reporting,
  mobile responsiveness, UI consistency.
- R3: temporary closures, calendar/events, admin access, accessibility, safety.
See `docs/REQUIREMENTS.md` for status.

## Stack
- Frontend: React + Vite + React Router + Leaflet
- Backend: Express + Node + Sequelize + Swagger
- Database: Postgres + PostGIS
- Routing: OSRM
- Orchestration: Docker Compose


## Repo Layout
- `frontend/` - React UI and map rendering
- `backend/` - Express API and auth
- `database/` - Postgres/PostGIS schema
- `osrm-data/` - campus OSM extract + OSRM artifacts
- `compose.yaml` - dev orchestration
- `compose.proxmox.yaml` - Proxmox deployment orchestration
- `compose.proxmox.images.yaml` - registry image override for pull-based deploys
- `.github/workflows/deploy-prod.yml` - production image build workflow
- `requirements.md` - project requirements (source of truth)

## Service URLs (local)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Postgres: `localhost:5433`
- OSRM: `http://localhost:5001`

## Current Feature Set (from codebase)
- Auth: register/login/logout/refresh with JWT cookies.
- User profile endpoint.
- Search history endpoints (store and clear searches).
- React pages: login, register, home, map, search, bookmarks, settings, about, help.
- Map view uses Leaflet + OpenStreetMap tiles with a campus marker.
- Swagger docs are generated from route files.
- Jest test suite for backend controllers, middleware, and routes.


## Data Sources
- Campus OSM extract in `osrm-data/map.osm`.
- OpenStreetMap tiles for map display.

## Known Gaps (observed)
- OSRM is not yet wired into backend endpoints.
- POI read endpoints are still missing for non-admin users.
- Search page now performs live fuzzy location matching; settings remains static UI.
- Bookmarks page now supports bookmark/list APIs, but history/recently viewed UI is still pending.
- Role-based access is partial: admin and owner controls are enforced, but
  student/faculty/visitor-specific policy checks are still limited.

## Non-Functional Requirements (summary)
- Security: protect login info, search history, and bookmarks; restrict admin actions.
- Reliability: handle large user counts and fast routing.
- Usability: intuitive UI, mobile-first layouts, UNT branding.
- Compatibility: modern desktop and mobile browsers (Chrome/Edge verified).
