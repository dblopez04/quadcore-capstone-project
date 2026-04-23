# Frontend Guide

## Scope
- React app for auth, map, search, bookmarks, events, admin, and static info pages.
- Leaflet handles the map view.
- API calls live under `frontend/src/api/`.

## Entry Points
- `frontend/src/main.jsx` - router and page wiring.
- `frontend/src/components/Layout.jsx` - shared app shell.
- `frontend/src/components/Navbar.jsx` - top nav/auth affordances.
- `frontend/src/MapView.jsx` - Leaflet container.
- `frontend/src/index.css` - theme tokens and shared styles.

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
- Search uses `frontend/src/api/locationService.js` to fetch `/api/locations` and apply client-side fuzzy ranking for location results.
- Routing UI uses `frontend/src/api/osrmService.js` to call `/api/osrm/route` and render OSRM GeoJSON responses on the map.
- Safety overlays use `frontend/src/api/safetyService.js` to fetch `/api/safety/well-lit-paths` and render curated well-lit segments on the map.
- Bookmarks UI calls `/api/locations/bookmarks` and `/api/locations/lists` for bookmark/list data and list item actions.
- Event cards use backend event details to show room/location detail when available.
- Events support save/unsave actions, per-saved-event email reminder toggles, and weekly digest subscriptions.
- Settings loads and updates the account email used for event-related emails, supports password-reset requests, and stores local route/map preferences.
- Event normalization must coerce `details` payloads into plain text before rendering; `details` objects are for metadata, not direct JSX output.
- `/admin` fronts the admin backend surface: locations, POIs, events, reports, and owner-only privilege delegation.

## Map UI Notes
- `frontend/src/pages/MapPage.jsx` includes a directions panel with start/end search, current-location start, point picking from the map, route swap/clear actions, a well-lit path overlay toggle, and walking ETA + distance summary.
- `/map?place=<locationId>` resolves the location by API and preloads it as the route destination.
- `frontend/src/MapView.jsx` renders the main Leaflet map, current-location marker, route start/destination markers, OSRM route geometry, and well-lit path overlays.
- Turn-by-turn maneuver text is still pending.

## Filters and Categories
POI categories defined in the database:
- ACADEMIC BUILDING, LIBRARY, DINING HALL, PARKING, DORMITORY, RECREATION, MEDICAL, LANDMARK, BATHROOM, RESTAURANT, OTHER.

User roles from requirements:
- STUDENT, FACULTY, ADMIN, VISITOR.

## Accessibility and Safety
- Provide toggles for accessible routes and well-lit paths.
- Surface accessibility details such as ramps, elevators, and auto doors in POI detail views.
- Well-lit path overlays are wired; accessible route data and route preference logic are still pending.

## Styling and Assets
- Theme variables live in `frontend/src/index.css` (UNT green, borders, spacing).
- Mobile demo layout uses `.phone-demo` and `.phone-card`.
- Logos live in `frontend/public/` and are referenced as `/UNT-logo.png` and `/UNT-logo2.png`.

## Local Development
```bash
cd frontend
npm install
npm run dev
```

## Build
```bash
cd frontend
npm run build
npm run preview
```

## Lint
```bash
cd frontend
npm run lint
```

## Conventions
- Put page components in `frontend/src/pages/`.
- Put reusable UI in `frontend/src/components/`.
- Keep API wrappers in `frontend/src/api/`.
- Reuse theme tokens from `frontend/src/index.css` instead of hard-coded colors.

## Known Gaps
- No dedicated POI layer or POI detail UI yet.
- No turn-by-turn maneuver list yet.
- Accessible route data and route scoring are not implemented yet.
