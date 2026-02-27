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
