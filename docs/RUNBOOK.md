# Runbook

## Setup
- Copy `.env.example` to `.env` and update secrets and credentials.
- The backend reads `DATABASE_URL` from env; Docker sets it to use the `db` service.
- Local backend dev expects `DATABASE_URL` to point to host Postgres
  (`postgres://...@localhost:5433/...`).
- Database schema is initialized from `database/init.sql` on first container start.
- For existing databases, apply incremental SQL migrations manually (for example:
  `database/migration_event_email_reminders.sql` for email reminder delivery state).

## Local Ports
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Postgres: `localhost:5433`
- OSRM: `http://localhost:5001`

## Common Commands

Full stack:
```bash
docker compose up --build
```

Single service:
```bash
docker compose up backend
docker compose logs -f backend
```

Frontend:
```bash
cd frontend
npm install
npm run dev
npm run lint
```

Backend:
```bash
cd backend
npm install
npm run dev
npm test
npm run test:coverage
```

## Map Refresh
Linux:
```bash
./import_osm.sh
```

macOS:
```bash
./import_osm_macos.sh
```

Notes:
- Both flows refresh OSM data, import PostGIS data, and rebuild/restart OSRM.
- `FORCE_MAP_REFRESH=1` forces a fresh download/extract.
- Delete `osrm-data/map.osrm*` only when you intentionally want a rebuild.
- Tooling commands use the compose `tools` profile.

## Seeds
Demo locations:
```bash
docker exec -i db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/seed_locations.sql
```

UNT events:
```bash
python3 scripts/import_unt_events_ics.py
```

Useful event import flags:
- `--days <n>`
- `--limit <n>`
- `--no-apply`
- `--output <path>`
- `--ignore-location "<name>"`

## Rebuilds
Destructive local rebuild:
```bash
./scripts/rebuild.sh --dev
```

Destructive prod-style rebuild:
```bash
./scripts/rebuild.sh --prod
```
Set reminder env vars before starting the backend if you want delivery enabled:
- `RESEND_API_KEY`
- `EMAIL_FROM`
- optional `REMINDER_POLL_INTERVAL_MS` (defaults to `60000`)

Container reset:
```bash
docker compose down -v
```

## Deployment
- Proxmox deploy commands live in `docs/DEPLOYMENT.md`.
- Public health check: `/healthz`
- Public docs: `/docs`

## Gotchas
- Frontend uses `VITE_API_BASE_URL`, defaulting to `http://localhost:4000`.
- Production frontend base URL should be empty or the site origin, not `/api`.
- Backend CORS derives from `FRONTEND_URL` and allows localhost dev origins.
- Apple Silicon may run DB and OSRM images under emulation.
