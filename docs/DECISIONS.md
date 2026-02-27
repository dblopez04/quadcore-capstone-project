# Decisions

Record architectural or behavior changes here. Keep entries short and dated.

## When to Add an Entry
- API contract changes (routes, auth flow, response shapes).
- Database schema changes (tables, enums, constraints).
- Map data source changes (OSRM, OSM extracts).
- Service ports or env var changes that affect local dev.
- Requirement changes or reinterpretations from `requirements.md`.

## YYYY-MM-DD - Title
Status: proposed | accepted | deprecated

Context:

Decision:

Consequences:

## 2026-02-27 - Consolidate User Search to `/api/search`
Status: accepted

Context:
Both `/api/locations?search=` and `/api/search` offered overlapping search behavior,
which split search logic across endpoints and made ranking consistency harder.

Decision:
Treat `/api/search` as the single user-facing search endpoint for location and POI
discovery, and remove legacy text-filter behavior from `GET /api/locations`.

Consequences:
Search ranking and query validation now live in one place. `/api/locations` remains
a deterministic alphabetical listing endpoint, while all user search use cases should
call `/api/search`.

## 2026-02-27 - Federated Search API Across Locations and POIs
Status: accepted

Context:
Searching only locations does not match expected map behavior. Users should find
POIs such as cafes and services with mixed queries that also include campus
location names.

Decision:
Add `GET /api/search` as a public federated endpoint that queries both
`locations` and `points_of_interest`, ranks mixed results, and returns a unified
payload with `result_type`, ids, map coordinates, and `share_url`.

Consequences:
The frontend can use one endpoint for map search/autocomplete while keeping
location-based deep linking and personalization behavior.

## 2026-02-27 - Location QoL APIs for Lists, Notes, Recency, and Share Links
Status: accepted

Context:
Users need map-style quality-of-life features for saved places without depending on
route calculations: custom collections, personal notes, recently viewed places, and
shareable deep links.

Decision:
Extend the location domain with three schema additions:
`location_lists`, `location_list_items`, and `recently_viewed_locations`. Add
authenticated location routes for list CRUD, list item management, and recently
viewed upserts/reads. Add location deep-link generation via
`GET /api/locations/:locationId/share-link` and include `share_url` in location
summary payloads.

Consequences:
Backend now supports location organization and recency tracking for each user while
keeping bookmark notes in `location_bookmarks.notes`. Frontend wiring can consume
the new APIs incrementally without further schema changes.

## 2026-02-27 - Owner-Gated Admin Delegation
Status: accepted

Context:
Admin delegation endpoints existed, but any admin could grant/revoke admin and the
auth register endpoint accepted `ADMIN` directly. This allowed privilege escalation
and made ownership responsibilities unclear.

Decision:
Keep `ADMIN` as the elevated user role and add owner metadata to the `admin` table:
`is_owner` and `previous_role`. Add `requireOwner` middleware and gate delegation
endpoints (`grant-admin`, `revoke-admin`, `grant-owner`, `revoke-owner`) behind it.
Update registration to only accept `STUDENT`, `FACULTY`, and `VISITOR`.

Consequences:
Privilege assignment is now explicit and owner-controlled, admin revocation restores
the user's prior role, and initial environments can bootstrap ownership through the
owner middleware fallback when no owner exists yet.

## 2026-02-25 - Remove Legacy POI Bookmarks Table
Status: accepted

Context:
The `bookmarks` table and Sequelize model were not used by active API routes.
Bookmark features now use `event_bookmarks` and `location_bookmarks`.

Decision:
Remove the legacy POI `bookmarks` table from schema initialization and remove its
unused Sequelize model/associations. Add a migration script to drop the table in
existing environments.

Consequences:
Database and backend model wiring are simpler and only include bookmark entities
that are currently implemented.

## 2026-02-25 - Location Bookmarks API and Join Table
Status: accepted

Context:
The app needs bookmark logic that works directly on `locations` data from Postgres.
Existing bookmark support covered POIs (`bookmarks`) and events (`event_bookmarks`)
but not location-level saves.

Decision:
Add a `location_bookmarks` join table (`user_id` + `location_id` unique) and expose
authenticated location bookmark routes under `/api/locations` for list, create,
update, and remove operations. Also expose public read endpoints for locations to
support bookmark selection flows.

Consequences:
Schema initialization and runtime APIs now support location-level bookmark
management without changing existing POI/event bookmark behavior.

## 2026-02-09 - Event Bookmarks Join Table and API
Status: accepted

Context:
Users need to save events and fetch their saved events for calendar views. Existing
bookmarks are POI-only, and event registrations are for attendance rather than
saved items.

Decision:
Add an `event_bookmarks` join table linking users to events and expose user-facing
bookmark endpoints under `/api/events` for create/remove and date-range retrieval.

Consequences:
Schema initialization now includes `event_bookmarks`, and the backend gains new
authenticated routes for event bookmark operations.
