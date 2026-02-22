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
