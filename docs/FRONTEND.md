# Frontend Guide

## Responsibilities
- UI for auth, map, search, bookmarks, and settings.
- Map rendering with Leaflet and OpenStreetMap tiles.
- Calls backend auth endpoints and handles cookie-based sessions.

## Feature Targets (from `requirements.md`)
- R1: map render, POIs, search, current location, register, login.
- R2: routing, turn-by-turn, bookmarks, search history, POI filtering, reporting,
  mobile responsiveness, UI consistency.
- R3: closures, calendar/events, admin tools, accessibility, safety.

## Entry Points
- `frontend/src/main.jsx` - route definitions and app bootstrap.
- `frontend/src/components/Layout.jsx` - app shell with nav + footer.
- `frontend/src/components/Navbar.jsx` - top navigation.
- `frontend/src/MapView.jsx` - Leaflet map container.
- `frontend/src/api/auth.js` - login/register API helpers.

## Routes
| Path | Component | Notes |
| --- | --- | --- |
| `/` | `Login` | Auth login form |
| `/register` | `Register` | Account creation |
| `/home` | `Home` | Welcome copy |
| `/map` | `MapPage` | Map view |
| `/search` | `Search` | Live fuzzy location search + tabs |
| `/bookmarks` | `Bookmarks` | API-backed bookmark and custom list management UI |
| `/settings` | `Settings` | Static preferences UI |
| `/about` | `About` | Project info |
| `/help` | `Help` | Help text |

## API Integration
- `frontend/src/api/auth.js` uses `credentials: "include"` for cookie auth.
- API helpers read `VITE_API_BASE_URL` (fallback: `http://localhost:4000`).
- Keep `VITE_API_BASE_URL` in `frontend/.env` for local overrides.
- Search uses `frontend/src/api/locationService.js` to fetch `/api/locations` and
  apply client-side fuzzy ranking for location results.
- Routing UI uses `frontend/src/api/osrmService.js` to call `/api/osrm/route`
  and render OSRM GeoJSON responses on the map.
- Safety overlays use `frontend/src/api/safetyService.js` to fetch
  `/api/safety/well-lit-paths` and render curated well-lit segments on the map.
- Bookmarks UI strips the demo seed phrase (`Seeded from local OSM extract`)
  from subtitle text before rendering.
- Bookmarks UI now calls `/api/locations/bookmarks` and `/api/locations/lists`
  for bookmark/list data and list item actions.
- Guest mode (`Continue as Guest`) is tracked in `localStorage` (`authMode`).
  Guests can browse map/search but cannot save or manage bookmarks in the UI.
- Navbar auth action reflects mode: authenticated users see `Log Out`; guests or
  unauthenticated users see `Log In`, which routes to the login page.
- Planned APIs: POIs, routing, bookmarks, reporting, and events.

## Map UI Notes
- `frontend/src/pages/MapPage.jsx` now includes a directions panel with
  start/end search, current-location start, point picking from the map, route
  swap/clear actions, a well-lit path overlay toggle, and walking ETA + distance summary.
- `frontend/src/MapView.jsx` renders the main Leaflet map, current-location
  marker, route start/destination markers, OSRM route geometry, and well-lit
  path overlays.
- Turn-by-turn maneuver text is still pending.

## Filters and Categories
POI categories defined in the database:
- ACADEMIC BUILDING, LIBRARY, DINING HALL, PARKING, DORMITORY,
  RECREATION, MEDICAL, LANDMARK, BATHROOM, RESTAURANT, OTHER.

User roles (from requirements) should influence UI filtering:
- STUDENT, FACULTY, ADMIN, VISITOR.

## Accessibility and Safety
- Provide toggles for accessible routes and well-lit paths.
- Surface accessibility details (ramps, elevators, auto doors) in POI detail views.

## Styling and Assets
- Theme variables live in `frontend/src/index.css` (UNT green, borders, spacing).
- Mobile demo layout uses `.phone-demo` and `.phone-card`.
- Logos live in `frontend/public/` and are referenced as `/UNT-logo.png` and
  `/UNT-logo2.png`.

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
- Keep page-level UI in `frontend/src/pages/`.
- Reusable UI goes in `frontend/src/components/`.
- Prefer theme tokens over new hard-coded colors.
- Follow mobile-first layout rules and keep typography/colors consistent.

## Known Gaps
- Settings page is still static.
- No POI layer or turn-by-turn maneuver list yet.
