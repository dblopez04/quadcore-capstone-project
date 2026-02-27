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

## Auth Flow
- `POST /api/auth/register` - creates a user (`STUDENT`/`FACULTY`/`VISITOR` only) and sets `accessToken` and `refreshToken` cookies.
- `POST /api/auth/login` - validates credentials and sets cookies.
- `POST /api/auth/logout` - clears cookies and refresh token in DB.
- `POST /api/auth/refresh` - issues a new access token from refresh cookie.

Access tokens are stored in `accessToken` cookies and are validated by
`verifyToken` middleware.

Token timing (current):
- Access token JWT expiry: 30 minutes.
- Access cookie maxAge: 15 minutes.
- Refresh token JWT expiry: 7 days.

## User Routes
- `POST /api/user/profile` - returns the current user profile.
- `GET /api/user/search-history` - returns search history array.
- `POST /api/user/search-history` - prepends a search string.
- `DELETE /api/user/search-history` - clears search history.

All user routes expect cookie auth (`accessToken` and `refreshToken`).

## Event Bookmark Routes
All event bookmark routes are prefixed with `/api/events` and require `verifyToken`.

- `GET /api/events/bookmarks` - list the current user's bookmarked events
  (supports `?start=`, `?end=`, `?status=`, `?event_type=` filters).
- `POST /api/events/:eventId/bookmark` - bookmark an event.
- `DELETE /api/events/:eventId/bookmark` - remove an event bookmark.

## Location and Location Bookmark Routes
All location routes are prefixed with `/api/locations`.

- `GET /api/locations` - list locations from Postgres (optional `?search=` filter).
- `GET /api/locations/:locationId` - get a single location.

Location bookmark routes require `verifyToken`:
- `GET /api/locations/bookmarks` - list current user's bookmarked locations
  (supports `?favorite=true|false` and `?search=` filters).
- `POST /api/locations/:locationId/bookmark` - bookmark a location (idempotent).
- `PATCH /api/locations/:locationId/bookmark` - update bookmark metadata (`custom_name`,
  `notes`, `is_favorite`, `last_visited`).
- `DELETE /api/locations/:locationId/bookmark` - remove a location bookmark.

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

## CORS
The API allows `http://localhost:5173` with credentials. Update `backend/server.js`
if the frontend origin changes.

## Known Gaps
- No public endpoints for POIs yet (admin-only versions exist).
- POI bookmark functionality is not implemented.
- There is no frontend admin management UI yet for owner/admin assignment.
- Role-based access checks for non-admin routes (student/faculty/visitor-specific behavior) are still limited.
