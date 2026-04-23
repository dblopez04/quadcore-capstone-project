# Backend Guide

## Scope
- Express API with Swagger at `/docs`.
- JWT cookie auth with refresh-token fallback.
- Sequelize models backed by Postgres/PostGIS.

## Entry Points
- `backend/server.js` - app setup, middleware, and route mounting.
- `backend/app/routes/` - route files and Swagger comments.
- `backend/app/controllers/` - request handlers.
- `backend/app/middleware/` - auth and access control.
- `backend/app/models/` - Sequelize models.

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
- `/api/auth` - register, login, logout, refresh, forgot-password, reset-password.
- `/api/user` - profile, email updates, and search history.
- `/api/search` - federated search across locations and POIs.
- `/api/locations` - list, detail, share links, bookmarks, recently viewed, custom lists.
- `/api/events` - event listing plus bookmarks, registrations, reminders, conflicts, category subscriptions, tags.
- `/api/admin` - admin CRUD for locations, POIs, events, reports, and owner/admin delegation.
- `/api/osrm` - OSRM walking-route proxy.
- `/api/safety` - public safety overlays, currently well-lit path segments.
- `/healthz` - liveness check.

## Auth Model
- Access and refresh tokens are stored in HTTP-only cookies.
- `verifyToken` accepts a valid access token or refreshes from a valid refresh token.
- Access token JWT expiry and cookie maxAge are both 30 minutes.
- Refresh token JWT expiry is 7 days.
- `requireAdmin` protects admin routes.
- `requireOwner` protects owner delegation routes.
- First-owner bootstrap logic exists for owner assignment.
- Password reset uses single-use hashed reset tokens stored outside the `users` table.
- Reset emails are delivered through Resend and point users to the frontend reset page.
- Event saves and registrations attempt Resend confirmation emails when the user has an email on file and email env vars are configured.
- Weekly event category digests use the same Resend configuration and can be run with `npm run send:event-digests` from `backend/`.

## User Routes
- `POST /api/user/profile` - returns the current user profile.
- `GET /api/user/search-history` - returns search history array.
- `POST /api/user/search-history` - prepends a search string.
- `DELETE /api/user/search-history` - clears search history.

All user routes expect cookie auth. `accessToken` is used primarily, with `refreshToken` as fallback via `verifyToken`.

## Event Routes
All event bookmark, registration, reminder, and category subscription routes require `verifyToken`.

- `GET /api/events` - list/search events with filters for `q`, `start`, `end`, `status`, `event_type`, `location_id`, and `tags`. Search also matches imported event detail fields.
- `GET /api/events/bookmarks` - list the current user's bookmarked events.
- `GET /api/events/bookmarks.ics` - export bookmarked events as ICS.
- `POST /api/events/:eventId/bookmark` - bookmark an event.
- `DELETE /api/events/:eventId/bookmark` - remove an event bookmark.
- `GET /api/events/registrations` - list the current user's registrations.
- `POST /api/events/:eventId/register` - register for an event.
- `DELETE /api/events/:eventId/register` - unregister from an event.
- `GET /api/events/conflicts` - detect scheduling conflicts among bookmarked and/or registered events.
- `GET /api/events/reminders` - list event reminders for the current user.
- `POST /api/events/:eventId/reminders` - create a reminder for an event.
- `DELETE /api/events/reminders/:reminderId` - delete a reminder.
- `GET /api/events/tags` - list event tags.
- `POST /api/events/tags` - create a tag (admin only).
- `POST /api/events/:eventId/tags` - assign tags to an event (admin only).
- `DELETE /api/events/:eventId/tags/:tagId` - remove a tag from an event (admin only).

## Search and Location Routes
- `GET /api/search` - federated search across locations and POIs.
- `GET /api/locations` - list locations from Postgres, alphabetically.
- `GET /api/locations/:locationId` - get a single location.
- `GET /api/locations/:locationId/share-link` - get a canonical deep link for a location (`/map?place=<locationId>`).

Recently viewed routes require `verifyToken`:
- `GET /api/locations/recently-viewed` - list recently viewed locations.
- `POST /api/locations/:locationId/recently-viewed` - upsert recently viewed timestamp.

Location bookmark routes require `verifyToken`:
- `GET /api/locations/bookmarks` - list current user's bookmarked locations.
- `DELETE /api/locations/bookmarks/:bookmarkId` - remove a location bookmark by bookmark id.
- `POST /api/locations/:locationId/bookmark` - bookmark a location.
- `PATCH /api/locations/:locationId/bookmark` - update bookmark metadata.
- `DELETE /api/locations/:locationId/bookmark` - remove a location bookmark.

Custom list routes require `verifyToken`:
- `GET /api/locations/lists` - list custom location lists with items.
- `POST /api/locations/lists` - create a custom list.
- `PATCH /api/locations/lists/:listId` - rename a custom list.
- `DELETE /api/locations/lists/:listId` - delete a custom list.
- `POST /api/locations/lists/:listId/items` - add a location to a custom list.
- `DELETE /api/locations/lists/:listId/items/:locationId` - remove a location from a custom list.

## Admin Routes
All admin routes are prefixed with `/api/admin` and protected by `requireAdmin` middleware.

- Locations: list, create, update, and delete.
- POIs: list, create, update, and delete.
- Events: list, create, update, and delete.
- Reports: list, update status/assignment, and delete.
- User management: grant/revoke admin and owner privileges through owner-only endpoints.

## Models
- `User` - main auth table with roles and `search_history`.
- `Student`, `Faculty`, `Visitor` - role-specific tables.
- `EventDetail` - one-to-one structured metadata for imported event source fields.
- `WellLitPath` - geospatial `LINESTRING` segments representing manually curated well-lit sidewalks/streets.

## OSRM and Safety Integration
- `OSRM_URL` is provided in `compose.yaml` and is used by `/api/osrm/route` to proxy walking routes from the OSRM container.
- `GET /api/safety/well-lit-paths` returns manually curated well-lit path segments as both row metadata and a GeoJSON `FeatureCollection`.
- Safety path data is not yet used to alter OSRM route selection; it is currently available for map overlays and future route preference logic.

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

## CORS
The API allows credentials for local frontend origins and `FRONTEND_URL` (`http://localhost:5173` and `http://127.0.0.1:5173` are allowed by default).

## Known Gaps
- There is no standalone public POI list/details endpoint yet; POI discovery is currently exposed via `/api/search`.
- POI bookmark functionality is not implemented.
- There is no frontend wiring yet for location recently viewed/share-link flows.
- Well-lit path data is exposed through the API and rendered as an overlay, but no backend route scoring or filtering uses it yet.
- Role-based access checks for non-admin routes are still limited.
