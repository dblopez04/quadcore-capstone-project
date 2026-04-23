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

## 2026-04-20 - Store Well-Lit Walking Segments in PostGIS and Expose a Public Safety API
Status: accepted

Context:
The app needs a place to store campus-specific safety knowledge, beginning with
well-lit sidewalks and streets that are not represented as a first-class routing
signal in OpenStreetMap or OSRM. Team members need a repeatable way to seed and
query that data without hard-coding path lists into frontend components.

Decision:
Add a `well_lit_paths` PostGIS table with `LINESTRING` geometry plus metadata
(`name`, `path_type`, `lighting_level`, `is_preferred`, and `notes`). Add a
template seed file at `database/well_lit_paths_seed.sql` for manual segment
entry, and expose a public backend endpoint at `GET /api/safety/well-lit-paths`
that returns both record metadata and a GeoJSON `FeatureCollection`.

Consequences:
Well-lit segments now have a canonical storage model and can be displayed in the
map UI or used by future routing-preference logic. The team still needs to enter
actual coordinates for campus segments, and OSRM does not yet automatically
prefer those paths during route generation. Existing databases need
`database/migration_well_lit_paths.sql` before the seed file can be applied.

## 2026-03-18 - Drop Event Organizer and Store Import Metadata in `event_details`
Status: accepted

Context:
Imported UNT calendar events do not have a meaningful in-app organizer user, but
the schema required `events.organizer_id`. The importer was forced to create a
synthetic user and pack room/address/source data into `events.description`, which
made the data model misleading and hard to query.

Decision:
Drop `organizer_id` from `events` and add a one-to-one `event_details` table for
source-facing metadata (`source_url`, source venue strings, room detail, address,
image, website, and raw metadata JSON). Update the event API to return `details`
with each event and allow `q` search to match imported detail fields. Keep
source-derived tags so imported room/source-venue details remain searchable even
without a dedicated UI yet.

Consequences:
Imported events no longer pretend to be owned by a fake organizer account.
Structured metadata is queryable without bloating descriptions, and existing DBs
need `database/migration_event_details.sql` before the importer is rerun.

## 2026-03-16 - Seed Public UNT Events via Widget Scrape and Detail JSON-LD
Status: accepted

Context:
The UNT calendar widget does not expose an ICS feed for the filtered event set we
need to seed. The app already has an `events` table, but event venue matching has
to line up with the existing `locations` and `points_of_interest` data instead of
blindly creating duplicate venue rows.

Decision:
Add `scripts/scrape_unt_events.py` as a local ingestion tool. It scrapes the
public UNT widget for event URLs, hydrates each event from the detail page
`application/ld+json` payload plus page metadata, matches venues against existing
`locations` and `points_of_interest` through `psql`, emits idempotent SQL inserts,
and skips broad campus-wide venues (`UNIVERSITY OF NORTH TEXAS`, `ALL DINING HALLS`)
plus explicitly hidden venue names (`DISCOVERY PARK BUILDING`, `UNT COLAB`,
`FRISCO LANDING -- UNT AT FRISCO`). The matcher now supports explicit alias
overrides for ambiguous outdoor/common-area venues (for example `University Union
South Lawn -> University Union`, `Library Mall -> Willis Library`, and
`14C - Sagemore Lawn C -> Sage Hall`) and collapses room-style strings to the
parent building when possible.

The tool no longer creates new `locations` rows automatically. If a venue cannot
be matched confidently, the event is skipped and a `reports` row is emitted in the
generated SQL so the admin reports flow can handle manual mediation later. The
script now also applies its generated SQL directly to Postgres by default, with a
`--no-apply` escape hatch when we only want a file artifact, and refreshes
generated `EVENT_IMPORT` reports on each run so old failed-match artifacts do not
linger after matcher improvements.

Consequences:
Event seeding is reproducible without adding a backend admin scrape endpoint or a
schema migration. Calendar imports preserve richer source metadata in event
descriptions and tags, and ambiguous venue handling is safer because unresolved
cases become admin-review reports instead of bad foreign-key assignments or
auto-created map locations.

## 2026-03-08 - Split Docker Dev and Proxmox Deployment Stacks
Status: accepted

Context:
The repo only had development-oriented containers: Vite dev server, Nodemon,
direct host port exposure, and no reverse proxy/tunnel layer. That was not a
safe or repeatable layout for a Proxmox-hosted deployment behind Cloudflare.

Decision:
Convert the frontend and backend Dockerfiles to multi-stage builds, keep
`compose.yaml` focused on development targets, and add `compose.proxmox.yaml`
for production-style deployment. The Proxmox stack uses Caddy as the single
public web origin, proxies `/api`, `/docs`, and `/osrm/*`, and runs a
`cloudflared` connector with a named-tunnel token. Backend runtime config now
supports proxy-aware cookies, configurable port binding, extra CORS origins, and
an explicit `/healthz` endpoint.

Consequences:
Local development remains unchanged in intent, while deployment now has a
documented same-origin path that avoids frontend/backend cross-origin drift and
works cleanly behind Cloudflare Tunnel.

## 2026-03-04 - Enforce Guest-Mode Bookmark Restrictions in Frontend
Status: accepted

Context:
The login flow has a "Continue as Guest" path, but bookmark actions in search
and the bookmarks page were still exposed in UI flows. This caused failed API
calls and inconsistent behavior when users intentionally entered guest mode.

Decision:
Add explicit frontend guest-mode handling with `authMode` helpers, wire
"Continue as Guest" to set guest mode and attempt server logout, disable
"Bookmark" actions in search for guests, and render a sign-in-required state
for the bookmarks page when guest mode is active.

Consequences:
Guest users can no longer add bookmarks from the UI, and bookmark management
surfaces a clear sign-in prompt instead of API error states.

## 2026-03-04 - Make macOS OSM Import Idempotent and POI-Aware
Status: accepted

Context:
`import_osm_macos.sh` inserted only 500 named point features and assigned all
generated POIs to `OTHER`. Existing stale or invalid source files could also be
reused silently, causing missing locations. The previous Denton-wide extraction
box also pulled a large amount of non-UNT data.

Decision:
Update `import_osm_macos.sh` to validate OSM source files, support
`FORCE_MAP_REFRESH=1`, import named features from both `planet_osm_point` and
`planet_osm_polygon`, dedupe `locations` inserts by name+coordinate, and
update/insert `points_of_interest` with OSM tag-based category mapping. Set the
default extraction bounding box to UNT main campus/athletics
(`-97.165,33.198,-97.142,33.217`) with `DENTON_COBOX` override support.
Use `iboates/osmium:latest` for the compose `osmium` service and as the script
default, with `OSMIUM_IMAGE` override support in the macOS import script.

Consequences:
Map data refresh on macOS now captures substantially more named places, avoids
duplicate location growth across reruns, and produces more useful POI metadata
for search/filter behavior.

## 2026-03-04 - Frontend Fuzzy Location Search via Cached Location Index
Status: accepted

Context:
Search interactions in the frontend depended on strict backend text matches.
Minor typos or abbreviation-style input could miss valid campus locations even
when the correct location data was available.

Decision:
Update `frontend/src/api/locationService.js` so search fetches `/api/locations`
once, caches the list client-side, and applies a fuzzy scorer (prefix/infix,
subsequence, acronym, and typo-tolerant token matching) before returning the
top location results.

Consequences:
Search now handles misspellings and shorthand input more gracefully, and avoids
making a network request on every keystroke after the initial location fetch.
The backend federated `/api/search` endpoint remains available for broader
location+POI discovery use cases.

## 2026-03-04 - Wire Bookmark Lists Into Frontend Bookmarks Page
Status: accepted

Context:
Bookmark list APIs were already available (`/api/locations/lists` and list item
endpoints), but the frontend bookmarks page only displayed a basic bookmark list
and left list actions disabled.

Decision:
Update `frontend/src/pages/Bookmarks.jsx` to load bookmarks and custom lists
together, support list creation/rename/deletion, and support add/remove location
membership for lists directly from the bookmarks UI.

Consequences:
Bookmark-list behavior is now available end-to-end for authenticated users
without backend contract changes, and requirement 9 can be marked implemented.

## 2026-03-04 - Normalize Location Bookmark Response IDs
Status: accepted

Context:
`GET /api/locations/bookmarks` responses could omit usable location data in some
runtime shapes because serializer helpers assumed included associations were
always exposed as `Location` (capitalized). The frontend remove action depends on
`location_id`, and some payloads produced bookmarks without a resolvable id.

Decision:
Update location response serializers to read included associations from both
`Location` and `location` shapes, and include top-level `location_id` in location
bookmark responses (and related location list/recently viewed serializers).

Consequences:
Bookmark actions can consistently resolve the target `location_id`, reducing
frontend coupling to ORM include casing and preventing remove-flow failures.

## 2026-03-04 - Add Bookmark-ID Delete Endpoint for Location Bookmarks
Status: accepted

Context:
Some client flows may have a bookmark id but not a location id available in
memory (for example, legacy payloads or partially normalized frontend state).
Delete-by-location-id alone can fail in these cases.

Decision:
Add `DELETE /api/locations/bookmarks/:bookmarkId` to remove location bookmarks
using `location_bookmark_id` scoped to the authenticated user.

Consequences:
Clients can reliably remove bookmarks with either `location_id` or
`location_bookmark_id`, making bookmark removal resilient to response-shape
drift.

## 2026-03-02 - `verifyToken` Refresh Fallback and Token Lifetime Alignment
Status: accepted

Context:
Authenticated routes relied strictly on `accessToken` cookie presence. In
practice, users could retain a valid `refreshToken` while `accessToken` cookie
had already expired (cookie maxAge 15m vs JWT expiry 30m), causing avoidable
403/401 responses on protected endpoints.

Decision:
Update auth middleware so `verifyToken` (and shared auth checks used by
`requireAdmin`/`requireOwner`) first validates `accessToken`, then falls back to
`refreshToken` validation against DB state and issues a fresh `accessToken`
cookie when refresh succeeds. Align access cookie maxAge with access JWT expiry
at 30 minutes.

Consequences:
Protected API calls can transparently recover from expired/missing access
cookies when refresh state is valid, reducing auth interruptions while keeping
server-side refresh token checks in place.

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

## 2026-02-27 - Event Tags, Reminders, and Calendar Support APIs
Status: accepted

Context:
Calendar views need richer event metadata such as tags, saved reminders, and
registration/conflict detection endpoints. Existing schema did not include tag
or reminder tables.

Decision:
Add `event_tags`, `event_tag_assignments`, and `event_reminders` tables and expose
user-facing APIs for event search/filtering, registrations, reminders, conflicts,
and calendar exports.

Consequences:
Schema initialization gains new tables, and the backend now exposes additional
event APIs under `/api/events`.
