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
npm test
```

See `backend/tests/TEST_SUMMARY.md` for coverage notes and test breakdowns.

## CORS
The API allows `http://localhost:5173` with credentials. Update `backend/server.js`
if the frontend origin changes.

## Known Gaps
- No endpoints for locations, POIs, bookmarks, reports, events, or admin actions yet.
- `duplicateRegistration` middleware exists but is not wired to `/api/auth/register`.
- Role-based access checks are not enforced in middleware yet.
