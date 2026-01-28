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
For local tests, `backend/tests/setup.js` points to `localhost:5433`.

## Auth Flow
- `POST /api/auth/register` - creates a user and sets `accessToken` and `refreshToken` cookies.
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
- `GET /api/admin/users` - list all users (excludes password_hash, refresh_token)
- `POST /api/admin/users/:id/grant-admin` - grant admin privileges
- `POST /api/admin/users/:id/revoke-admin` - revoke admin privileges

## Models
- `User` - main auth table with roles and `search_history`.
- `Student`, `Faculty`, `Visitor` - role-specific tables (DB has `admin` too).

## Role-Based Access
- Requirements call for filtering access by user role (STUDENT/FACULTY/ADMIN/VISITOR).
- No role authorization middleware is implemented yet.

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
- `backend/tests/admin.test.js` - Admin API tests covering:
  - Middleware authentication (token and admin verification)
  - CRUD operations for locations, POIs, events, and reports
  - User admin management (grant/revoke privileges)

See `backend/tests/TEST_SUMMARY.md` for coverage notes and test breakdowns.

## CORS
The API allows `http://localhost:5173` with credentials. Update `backend/server.js`
if the frontend origin changes.

## Known Gaps
- No public endpoints for locations, POIs, or bookmarks yet (admin-only versions exist).
- `duplicateRegistration` middleware exists but is not wired to `/api/auth/register`.
- Role-based access checks for non-admin routes are not enforced in middleware yet.
