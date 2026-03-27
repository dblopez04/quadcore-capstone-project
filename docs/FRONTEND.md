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
- Event normalization must treat backend `details` payloads as metadata, not direct JSX content.
- The events page includes calendar browsing, category/search filters, registration management, save/unsave actions, and opt-in email reminders for saved events.
- Settings loads the current profile email and lets the user update the email address used for reminder delivery.

## Conventions
- Put page components in `frontend/src/pages/`.
- Put reusable UI in `frontend/src/components/`.
- Keep API wrappers in `frontend/src/api/`.
- Reuse theme tokens from `frontend/src/index.css` instead of hard-coded colors.

## Current Gaps
- Settings is still mostly static outside theme and email updates.
- Map still lacks live routing, route drawing, and current location behavior.
- POI-specific UI is thinner than the backend/data model implies.
