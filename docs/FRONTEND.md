# Frontend Guide

## Scope
- React app for auth, map, search, bookmarks, events, admin, and static info pages.
- Leaflet handles the map view.
- API calls live under `frontend/src/api/`.

## Entry Points
- `frontend/src/main.jsx` - router and page wiring
- `frontend/src/components/Layout.jsx` - shared app shell
- `frontend/src/components/Navbar.jsx` - top nav/auth affordances
- `frontend/src/MapView.jsx` - Leaflet container
- `frontend/src/index.css` - theme tokens and shared styles

## Routes
- `/` - login
- `/register`
- `/forgot-password`
- `/reset-password`
- `/home`
- `/search`
- `/bookmarks`
- `/map`
- `/events`
- `/admin`
- `/about`
- `/help`
- `/settings`

## API Notes
- Client base URL comes from `VITE_API_BASE_URL`.
- Requests that need auth use cookie credentials.
- Guest mode is tracked in `localStorage` as `authMode`.
- Forgot-password submits to `/api/auth/forgot-password`, and reset-password submits the emailed token to `/api/auth/reset-password`.
- Search, bookmarks, lists, and event flows already call the backend.
- Event cards use backend event details to show room/location detail when available.
- Event normalization must coerce `details` payloads into plain text before rendering; `details` objects are for metadata, not direct JSX output.
- `/admin` now fronts the full admin backend surface: locations, POIs, events, reports, and owner-only privilege delegation.

## Conventions
- Put page components in `frontend/src/pages/`.
- Put reusable UI in `frontend/src/components/`.
- Keep API wrappers in `frontend/src/api/`.
- Reuse theme tokens from `frontend/src/index.css` instead of hard-coded colors.

## Current Gaps
- Settings is mostly static.
- Map still lacks live routing, route drawing, and current location behavior.
- POI-specific UI is thinner than the backend/data model implies.
