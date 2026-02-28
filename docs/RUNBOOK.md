# Runbook

## Setup
- Copy `.env.example` to `.env` and update secrets and credentials.
- The backend reads `DATABASE_URL` from env; Docker sets it to use the `db` service.
- Database schema is initialized from `database/init.sql` on first container start.
- For existing databases, apply incremental SQL migrations manually (for example:
  `database/migration_location_qol.sql` for custom lists/recently viewed tables).

## Service Ports (local)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/docs`
- Postgres (host): `localhost:5433` (container uses 5432)
- OSRM (host): `http://localhost:5001` (container uses 5000)

## Docker Compose (full stack)
```bash
docker compose up --build
```

## Docker Compose (single service)
```bash
docker compose up backend
```

## View logs
```bash
docker compose logs -f backend
```

## Refresh map data (OSM + PostGIS + OSRM)
```bash
./import_osm.sh
```
This script uses the compose `tools` profile (`osmium`) to extract map data,
imports it into PostGIS, and restarts OSRM.
If your environment needs a different `osm2pgsql` image, override it:
`OSM2PGSQL_IMAGE=<image> ./import_osm.sh`

## Seed demo locations (non-destructive)
```bash
docker exec -i db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/seed_locations.sql
```

## Frontend (local)
```bash
cd frontend
npm install
npm run dev
```

## Backend (local)
```bash
cd backend
npm install
npm run dev
```

## Tests (backend)
```bash
cd backend
npm test
```
Tests expect Postgres on `localhost:5433`. Start the DB container first:
```bash
docker compose up db
```

## Coverage (backend)
```bash
cd backend
npm run test:coverage
```

## Lint (frontend)
```bash
cd frontend
npm run lint
```

## Reset containers (destructive)
```bash
docker compose down -v
```
Use this only if you need a clean slate; it removes volumes and data.

## Common Gotchas
- Frontend API base URL is hard-coded in `frontend/src/api/auth.js`; update it if running inside Docker.
- OSRM rebuilds only when `osrm-data/map.osrm` is missing; see `docs/MAP.md` before deleting files.
- Tooling services behind compose profiles are not started by default; use `docker compose --profile tools ...` when running `osmium`.
- Docker uses `linux/amd64` for DB and OSRM images; Apple Silicon may run under emulation.
