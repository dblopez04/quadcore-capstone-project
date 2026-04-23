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
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PASSWORD_RESET_URL_BASE`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `WEEKLY_DIGEST_WINDOW_DAYS`
- `OSRM_URL`
- `DB_CONNECT_MAX_ATTEMPTS`
- `DB_CONNECT_RETRY_DELAY_MS`
- `TRUST_PROXY_HOPS`
- `COOKIE_SAMESITE`
- `COOKIE_SECURE`
- `COOKIE_DOMAIN`

## Route Groups
- `/api/auth` - register, login, logout, refresh, forgot-password, reset-password
- `/api/user` - profile, email updates, and search history
- `/api/search` - federated search across locations and POIs
- `/api/locations` - list, detail, share links, bookmarks, recently viewed, custom lists
- `/api/events` - event listing plus bookmarks, registrations, reminders, conflicts, category subscriptions, tags
- `/api/admin` - admin CRUD for locations, POIs, events, reports, and owner/admin delegation
- `/healthz` - liveness check

## Auth Model
- Access and refresh tokens are stored in HTTP-only cookies.
- `verifyToken` accepts a valid access token or refreshes from a valid refresh token.
- `requireAdmin` protects admin routes.
- `requireOwner` protects owner delegation routes.
- First-owner bootstrap logic exists for owner assignment.
- Password reset uses single-use hashed reset tokens stored outside the `users` table.
- Reset emails are delivered through Resend and point users to the frontend reset page.
- Event saves now attempt a Resend confirmation email when the user has an email on file and email env vars are configured.
- Event registrations now attempt a Resend confirmation email when the user has an email on file and email env vars are configured.
- Weekly event category digests use the same Resend configuration and can be run with
  `npm run send:event-digests` from `backend/`.

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
