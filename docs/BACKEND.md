# Backend Guide

## Scope
- Express API with Swagger at `/docs`
- JWT cookie auth with refresh-token fallback
- Sequelize models backed by Postgres/PostGIS

## Entry Points
- `backend/server.js` - app setup, middleware, route mounting
- `backend/app/routes/` - route files and Swagger comments
- `backend/app/controllers/` - request handlers
- `backend/app/middleware/` - auth and access control
- `backend/app/models/` - Sequelize models

## Important Env Vars
- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `OSRM_URL`
- `DB_CONNECT_MAX_ATTEMPTS`
- `DB_CONNECT_RETRY_DELAY_MS`
- `TRUST_PROXY_HOPS`
- `COOKIE_SAMESITE`
- `COOKIE_SECURE`
- `COOKIE_DOMAIN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `REMINDER_POLL_INTERVAL_MS`

## Route Groups
- `/api/auth` - register, login, logout, refresh
- `/api/user` - profile, email update, and search history
- `/api/search` - federated search across locations and POIs
- `/api/locations` - list, detail, share links, bookmarks, recently viewed, custom lists
- `/api/events` - event listing, bookmarks, registrations, reminders, conflicts, and ICS export
- `/api/admin` - admin CRUD for locations, POIs, events, reports, and owner/admin delegation
- `/healthz` - liveness check

## Auth Model
- Access and refresh tokens are stored in HTTP-only cookies.
- `verifyToken` accepts a valid access token or refreshes from a valid refresh token.
- `requireAdmin` protects admin routes.
- `requireOwner` protects owner delegation routes.
- First-owner bootstrap logic exists for owner assignment.

## Event Notes
- `GET /api/events` supports `q`, `start`, `end`, `status`, `event_type`, and `location_id`.
- Event search also matches imported event detail fields such as source location name and room detail.
- `GET /api/events/bookmarks` and `GET /api/events/registrations` return normalized event payloads with nested `location` and optional `details`.
- `GET /api/events/bookmarks.ics` exports the current user’s bookmarked events as an ICS file.
- `POST /api/events/:eventId/register` creates a registration and sends a confirmation email when `RESEND_API_KEY`, `EMAIL_FROM`, and a user email are present.
- `POST /api/events/:eventId/reminders` supports `IN_APP` reminders with a provided `remind_at`, plus `EMAIL` reminders that are pinned to 24 hours before the event start.
- Email reminders require the event to already be bookmarked.
- `backend/app/jobs/reminderDispatcher.js` polls due `EMAIL` reminders and sends them through Resend when email env vars are configured.

## Tests
Run from `backend/`:
```bash
npm test
npm run test:watch
npm run test:coverage
```

High-value suites cover:
- auth role restrictions and owner bootstrap
- admin RBAC and event `location_id` validation
- federated search validation and ranking
- location bookmarks, lists, recently viewed, and share links

## Current Gaps
- OSRM is configured but not yet wired into live routing endpoints.
- There is still no full public POI read surface outside federated search/admin flows.
- Frontend coverage for some backend features is incomplete.
- Non-admin role policies are still shallow.
