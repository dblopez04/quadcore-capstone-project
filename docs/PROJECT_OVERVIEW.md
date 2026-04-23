# Project Overview

## Goal
Campus navigation app for UNT with account-based features, searchable places, map views, event support, and future accessibility/safety routing.

## Stack
- Frontend: React, Vite, React Router, Leaflet
- Backend: Express, Sequelize, Swagger
- Data: Postgres, PostGIS
- Routing engine: OSRM
- Runtime: Docker Compose

## Repo Layout
- `frontend/` - React UI
- `backend/` - Express API
- `database/` - schema and seed SQL
- `osrm-data/` - OSM extract and OSRM artifacts
- `compose*.yaml` - local and deployment stacks

## Current State
- Auth is implemented with JWT cookies and refresh flow.
- Frontend includes login, register, forgot-password, home, search, map, bookmarks, events, admin, about, help, and settings pages.
- Password reset requests issue backend-generated reset tokens and email delivery through Resend.
- Event saves, registrations, reminders, and category digest subscriptions exist in the API, with confirmation/digest email support when Resend is configured.
- Backend exposes auth, user, search, locations, events, admin, OSRM, and safety route groups.
- Search, location bookmarks/lists, event bookmarks/registrations/reminders, and event category digest subscriptions exist in the API.
- Admin CRUD flows exist in the API.
- Map view uses Leaflet + OpenStreetMap tiles, browser geolocation, destination search, OSRM route rendering for walking directions, and optional well-lit path overlays.
- Safety path metadata can be stored in PostGIS through `well_lit_paths` and served to clients through `/api/safety/well-lit-paths`.
- Swagger is generated from route files.
- Jest test suites cover backend controllers, middleware, and routes.

## Data Sources
- Campus OSM extract in `osrm-data/map.osm`.
- OpenStreetMap tiles for map display.
- Curated well-lit path seed SQL in `database/well_lit_paths_seed.sql`.

## Known Gaps
- Public POI access is still limited compared with the original requirements; POI discovery exists through federated search and admin flows.
- Map routing currently shows geometry, ETA, and distance, but not turn-by-turn maneuver text.
- Well-lit paths are rendered as overlays but are not yet used to score or alter OSRM route selection.
- Role-specific behavior beyond admin/owner remains limited.
- Closures and richer route metadata are not modeled yet.

## Non-Functional Requirements
- Security: protect login info, search history, and bookmarks; restrict admin actions.
- Reliability: handle large user counts and fast routing.
- Usability: intuitive UI, mobile-first layouts, UNT branding.
- Compatibility: modern desktop and mobile browsers.

## Use This With
- `docs/AREAS.md` for file ownership and path lookup.
- `docs/RUNBOOK.md` for ports and commands.
