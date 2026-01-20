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
| `/search` | `Search` | Static search UI + tabs |
| `/bookmarks` | `Bookmarks` | Static list UI |
| `/settings` | `Settings` | Static preferences UI |
| `/about` | `About` | Project info |
| `/help` | `Help` | Help text |

## API Integration
- `frontend/src/api/auth.js` uses `credentials: "include"` for cookie auth.
- `API_BASE_URL` is currently `http://localhost:4000`.
- If running frontend inside Docker, update the base URL to `http://backend:4000`
  or move it to a Vite env var (example: `VITE_API_BASE_URL`).
- Planned APIs: POIs, routing, bookmarks, reporting, and events.

## Map UI Notes
- `frontend/src/MapView.jsx` currently renders a static Leaflet map and marker.
- Planned: add user location using the Geolocation API (with permission prompts).
- Planned: draw route polylines and step-by-step directions from OSRM responses.

## Filters and Categories
POI categories defined in the database:
- ACADEMIC BUILDING, LIBRARY, DINING HALL, PARKING, DORMITORY,
  RECREATION, MEDICAL, LANDMARK, BATHROOM, RESTAURANT, OTHER.

User roles (from requirements) should influence UI filtering:
- STUDENT, FACULTY, ADMIN, VISITOR.

## Accessibility and Safety (planned)
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
- Search, bookmarks, and settings pages are static UI only.
- No POI layer, route drawing, or current location display yet.
