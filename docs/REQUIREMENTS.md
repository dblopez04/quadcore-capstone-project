# Requirements

Status is based on the current codebase and may change as features ship.

Status legend:
- Implemented: working end-to-end in UI and API
- Partial (UI): UI exists, backend not wired
- Partial (API): API exists, UI not wired
- Not started: no implementation yet

| ID | Requirement | Release | Status | Area | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Map render | R1 | Implemented | Frontend/Map | Leaflet map renders campus tiles, markers, and routing overlays |
| 2 | Points of interest | R1 | Partial (API) | Map/DB/Backend/Frontend | Admin POI CRUD exists and public POI discovery is available through federated `/api/search`; no dedicated POI UI/list endpoint yet |
| 3 | Location search | R1 | Implemented | Frontend/Backend | Search page now performs client-side fuzzy ranking over `/api/locations` data with typo tolerance and live results |
| 4 | Current location | R1 | Implemented | Frontend/Map | Browser geolocation can populate the route start point on the map page |
| 5 | Register | R1 | Implemented | Frontend/Backend | Register UI + API |
| 6 | Login | R1 | Implemented | Frontend/Backend | Login UI + API |
| 7 | Routing | R2 | Implemented | Backend/Map/Frontend | OSRM API is wired and the map page can request and render walking routes |
| 8 | Turn-by-turn navigation | R2 | Partial (UI) | Backend/Frontend | Route geometry, ETA, and distance are shown; maneuver-by-maneuver instructions are not yet rendered |
| 9 | Bookmarks | R2 | Implemented | Frontend/Backend/DB | Bookmarks page now loads user bookmarks and custom lists, supports list create/rename/delete, and supports adding/removing locations in lists |
| 10 | Search history | R2 | Partial (API) | Backend/Frontend | API exists, UI not wired |
| 11 | POI filtering | R2 | Partial (UI) | Frontend/Backend | Filter pills only |
| 12 | User reporting | R2 | Not started | Backend/DB/Frontend | Enums exist, no tables |
| 13 | Temporary closures | R3 | Not started | Backend/DB/Map | No data model yet |
| 14 | Calendar | R3 | Partial (API) | Backend/DB/Frontend | Event bookmarks, search, tags, reminders, registrations, conflicts, and ICS export added; public UNT calendar SQL seeding now available through `scripts/scrape_unt_events.py`, imported source metadata is stored in `event_details`, but no UI yet |
| 15 | Administrator access | R3 | Partial (API) | Backend/Frontend | Owner-gated admin delegation API exists (`grant/revoke admin`, `grant/revoke owner`), but no admin UI yet |
| 16 | Accessibility | R3 | Not started | Map/Frontend | No data or filters |
| 17 | Safety | R3 | Not started | Map/Frontend | No well-lit routing data |
| 18 | Mobile responsiveness | R2 | Partial (UI) | Frontend | Mobile-first layout exists |
| 19 | UI consistency | R2 | Partial (UI) | Frontend | Theme tokens exist |
