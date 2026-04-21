# Project Overview

## Goal
Campus navigation app for UNT with account-based features, searchable places,
map views, event support, and future accessibility/safety routing.

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
- Frontend includes login, register, forgot-password, home, search, map,
  bookmarks, events, admin, about, help, and settings pages.
- Password reset requests now issue backend-generated reset tokens and email delivery through Resend.
- Event registrations can also trigger a confirmation email through Resend when email delivery is configured.
- Backend exposes auth, user, search, locations, events, and admin route groups.
- Search, location bookmarks/lists, event bookmarks/registrations/reminders, and
  admin CRUD flows exist in the API.
- Swagger is generated from route files.

## Known Gaps
- Backend does not call OSRM yet, so route geometry and turn-by-turn are not live.
- Public POI access is still limited compared with the original requirements.
- Some frontend pages are present but only partially wired, especially settings
  and parts of the map/bookmark flows.
- Role-specific behavior beyond admin/owner remains limited.

## Use This With
- `docs/AREAS.md` for file ownership and path lookup
- `docs/RUNBOOK.md` for ports and commands
