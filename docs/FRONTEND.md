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
- Search, bookmarks, lists, and event flows already call the backend.

## Conventions
- Put page components in `frontend/src/pages/`.
- Put reusable UI in `frontend/src/components/`.
- Keep API wrappers in `frontend/src/api/`.
- Reuse theme tokens from `frontend/src/index.css` instead of hard-coded colors.

## Current Gaps
- Settings is mostly static.
- Map still lacks live routing, route drawing, and current location behavior.
- POI-specific UI is thinner than the backend/data model implies.
