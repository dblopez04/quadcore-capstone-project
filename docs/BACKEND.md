# Backend Guide

## Responsibilities
- Express API for auth and user data.
- JWT-based auth with HTTP-only cookies.
- Swagger/OpenAPI docs at `/docs`.

## Feature Targets (from `requirements.md`)
- R1: register/login and map/POI read APIs.
- R2: routing + turn-by-turn, bookmarks, search history, POI filtering, reporting.
- R3: closures, events/calendar, admin access, accessibility and safety logic.

## Entry Points
- `backend/server.js` - Express setup and route mounting.
- `backend/app/routes/` - route definitions with Swagger comments.
- `backend/app/controllers/` - route handlers.
- `backend/app/middleware/auth.middleware.js` - auth helpers.
- `backend/app/models/` - Sequelize models.

## Environment Variables
- `DATABASE_URL` - Postgres connection string (used by Sequelize).
- `JWT_SECRET` - access token secret.
- `JWT_REFRESH_SECRET` - refresh token secret.
- `OSRM_URL` - OSRM base URL (defined in `compose.yaml`).
- `FRONTEND_URL` - optional base URL used to generate shareable location deep links
  (defaults to `http://localhost:5173`).

## Auth Flow
- `POST /api/auth/register` - creates a user (`STUDENT`/`FACULTY`/`VISITOR` only) and sets `accessToken` and `refreshToken` cookies.
- `POST /api/auth/login` - validates credentials and sets cookies.
- `POST /api/auth/logout` - clears cookies and refresh token in DB.
- `POST /api/auth/refresh` - issues a new access token from refresh cookie.

Access tokens are stored in `accessToken` cookies and are validated by
`verifyToken` middleware. If `accessToken` is missing or expired but a valid
`refreshToken` cookie exists (and matches the DB token), `verifyToken`
automatically issues a new `accessToken` cookie and continues the request.

Token timing (current):
- Access token JWT expiry: 30 minutes.
- Access cookie maxAge: 30 minutes.
- Refresh token JWT expiry: 7 days.

## User Routes
- `POST /api/user/profile` - returns the current user profile.
- `GET /api/user/search-history` - returns search history array.
- `POST /api/user/search-history` - prepends a search string.
- `DELETE /api/user/search-history` - clears search history.

All user routes expect cookie auth. `accessToken` is used primarily, with
`refreshToken` as fallback via `verifyToken`.

## Event Bookmark Routes
All event bookmark routes are prefixed with `/api/events` and require `verifyToken`.

- `GET /api/events` - list/search events (filters: `q`, `start`, `end`, `status`,
  `event_type`, `location_id`, `organizer_id`, `tags`).
- `GET /api/events/bookmarks` - list the current user's bookmarked events
  (supports `?start=`, `?end=`, `?status=`, `?event_type=`, `?tags=` filters).
- `GET /api/events/bookmarks.ics` - export bookmarked events as ICS.
- `POST /api/events/:eventId/bookmark` - bookmark an event.
- `DELETE /api/events/:eventId/bookmark` - remove an event bookmark.
- `GET /api/events/registrations` - list the current user's registrations.
- `POST /api/events/:eventId/register` - register for an event.
- `DELETE /api/events/:eventId/register` - unregister from an event.
- `GET /api/events/conflicts` - detect scheduling conflicts among bookmarked
  and/or registered events.
- `GET /api/events/reminders` - list event reminders for the current user.
- `POST /api/events/:eventId/reminders` - create a reminder for an event.
- `DELETE /api/events/reminders/:reminderId` - delete a reminder.
- `GET /api/events/tags` - list event tags.
- `POST /api/events/tags` - create a tag (admin only).
- `POST /api/events/:eventId/tags` - assign tags to an event (admin only).
- `DELETE /api/events/:eventId/tags/:tagId` - remove a tag from an event (admin only).

## Federated Search Route
- `GET /api/search` - federated search across locations and POIs.
- Parameters:
  - `q` (required) - query text.
  - `types` (optional) - comma-separated `location,poi` (defaults to both).
  - `limit` (optional) - max result count (default 20, max 50).
- Returns a ranked mixed result list with normalized fields (`result_type`,
  ids, title/subtitle, coordinates, and `share_url`).

## Location and Location Bookmark Routes
All location routes are prefixed with `/api/locations`.

- `GET /api/locations` - list locations from Postgres (full list, alphabetical).
- `GET /api/locations/:locationId` - get a single location.
- `GET /api/locations/:locationId/share-link` - get a canonical deep link for a
  location (`/map?place=<locationId>`).

Recently viewed routes require `verifyToken`:
- `GET /api/locations/recently-viewed` - list recently viewed locations
  (supports `?limit=`).
- `POST /api/locations/:locationId/recently-viewed` - upsert recently viewed timestamp.

Location bookmark routes require `verifyToken`:
- `GET /api/locations/bookmarks` - list current user's bookmarked locations
  (supports `?favorite=true|false` and `?search=` filters). Each bookmark
  includes both `location_id` and nested `location` summary data.
- `DELETE /api/locations/bookmarks/:bookmarkId` - remove a location bookmark by
  bookmark id (fallback-safe when clients only have bookmark ids).
- `POST /api/locations/:locationId/bookmark` - bookmark a location (idempotent).
- `PATCH /api/locations/:locationId/bookmark` - update bookmark metadata (`custom_name`,
  `notes`, `is_favorite`, `last_visited`).
- `DELETE /api/locations/:locationId/bookmark` - remove a location bookmark.

Custom list routes require `verifyToken`:
- `GET /api/locations/lists` - list custom location lists with items.
- `POST /api/locations/lists` - create a custom list.
- `PATCH /api/locations/lists/:listId` - rename a custom list.
- `DELETE /api/locations/lists/:listId` - delete a custom list.
- `POST /api/locations/lists/:listId/items` - add a location to a custom list.
- `DELETE /api/locations/lists/:listId/items/:locationId` - remove a location from a
  custom list.

## Admin Routes
All admin routes are prefixed with `/api/admin` and protected by `requireAdmin` middleware.

**Locations:**
- `GET /api/admin/locations` - list all locations (optional `?search=` filter)
- `POST /api/admin/locations` - create a location
- `PUT /api/admin/locations/:id` - update a location
- `DELETE /api/admin/locations/:id` - delete a location

**POIs:**
- `GET /api/admin/pois` - list all POIs (optional `?category=` filter)
- `POST /api/admin/pois` - create a POI
- `PUT /api/admin/pois/:id` - update a POI
- `DELETE /api/admin/pois/:id` - delete a POI

**Events:**
- `GET /api/admin/events` - list all events (optional `?status=` filter)
- `POST /api/admin/events` - create an event
- `PUT /api/admin/events/:id` - update an event
- `DELETE /api/admin/events/:id` - delete an event

**Reports:**
- `GET /api/admin/reports` - list reports (optional `?status=`, `?priority=`, `?type=` filters)
- `PUT /api/admin/reports/:id` - update report status/assignment
- `DELETE /api/admin/reports/:id` - delete a report

**User Management:**
- `GET /api/admin/users` - list all users (excludes password_hash, refresh_token) with `is_admin` and `is_owner` flags
- `POST /api/admin/users/:id/grant-admin` - grant admin privileges (owner-only)
- `POST /api/admin/users/:id/revoke-admin` - revoke admin privileges (owner-only)
- `POST /api/admin/users/:id/grant-owner` - grant owner privileges to an admin (owner-only)
- `POST /api/admin/users/:id/revoke-owner` - revoke owner privileges (owner-only, cannot revoke last owner)

## Models
- `User` - main auth table with roles and `search_history`.
- `Student`, `Faculty`, `Visitor` - role-specific tables (DB has `admin` too).

## Role-Based Access
- `verifyToken` enforces authenticated access for user-only routes.
- `requireAdmin` enforces admin-table membership for `/api/admin/*`.
- `requireOwner` gates privilege delegation endpoints to site owners.
- Bootstrap behavior: when no owner exists yet, admin users can only call `grant-owner` to establish the first owner.

## OSRM Integration (planned)
- `OSRM_URL` is provided in `compose.yaml` but not used yet.
- For routing, OSRM `/route/v1/foot` can provide steps and geometry.

## Local Development
```bash
cd backend
npm install
npm run dev
```

## Tests
```bash
cd backend
npm test              # run all tests
npm run test:watch    # run tests in watch mode
npm run test:coverage # run tests with coverage report
```

### Test Files
- `backend/tests/admin.rbac.test.js` - owner/admin delegation safety and prior-role restoration tests.
- `backend/tests/auth.register-rbac.test.js` - self-registration role restriction tests.
- `backend/tests/auth.middleware.owner.test.js` - `requireOwner` middleware behavior, including bootstrap mode.
- `backend/tests/location.qol.test.js` - location share-link, recently viewed, and custom list controller behavior.
- `backend/tests/search.federated.test.js` - mixed POI/location ranking and query validation for `/api/search`.
- `backend/tests/search.validation.test.js` - limit/type/token validation and POI-only behavior for `/api/search`.
- `backend/tests/location.listing.test.js` - verifies `/api/locations` list behavior (non-search).

## CORS
The API allows credentials for local frontend origins and `FRONTEND_URL`
(`http://localhost:5173` and `http://127.0.0.1:5173` are allowed by default).

## Known Gaps
- There is no standalone public POI list/details endpoint yet; POI discovery is currently exposed via `/api/search`.
- POI bookmark functionality is not implemented.
- Legacy location text search via `/api/locations?search=` was removed in favor of `/api/search`.
- There is no frontend wiring yet for location custom lists/recently viewed/share links.
- There is no frontend admin management UI yet for owner/admin assignment.
- Role-based access checks for non-admin routes (student/faculty/visitor-specific behavior) are still limited.
