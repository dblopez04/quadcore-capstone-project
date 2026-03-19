# Runbook

## Setup
- Copy `.env.example` to `.env` and update secrets and credentials.
- The backend reads `DATABASE_URL` from env; Docker sets it to use the `db` service.
- Local backend dev expects `DATABASE_URL` to point to host Postgres
  (`postgres://...@localhost:5433/...`).
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

On macOS, prefer:
```bash
./import_osm_macos.sh
```
The macOS script validates source files, imports named features from both
`planet_osm_point` and `planet_osm_polygon`, inserts missing `locations`
idempotently, and updates/inserts `points_of_interest` with tag-based categories.
Set `FORCE_MAP_REFRESH=1` to force a re-download and re-extract before import.
Default extraction box is tuned for UNT main campus:
`-97.165,33.198,-97.142,33.217`.
Override with `DENTON_COBOX=<min_lon,min_lat,max_lon,max_lat>` if needed.
If your machine cannot pull the default osmium image, override it:
`OSMIUM_IMAGE=<image> ./import_osm_macos.sh`
Current default osmium image: `iboates/osmium:latest`.

## Seed demo locations (non-destructive)
```bash
docker exec -i db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/seed_locations.sql
```

## Seed UNT events from the public calendar
Generate SQL from the public UNT Localist widget, resolve event venues against the
current `locations`/`points_of_interest` tables, write an idempotent seed file,
and apply it to Postgres:
```bash
python3 scripts/scrape_unt_events.py
```

Useful flags:
- `--output -` prints SQL to stdout instead of writing `database/seed_unt_events.sql`
- `--limit 10` limits the number of widget events fetched during testing
- `--no-apply` generates the SQL file without executing it against Postgres
- `--ignore-location "Some Venue"` skips additional broad venue names

Behavior:
- skips widget events whose location is `UNIVERSITY OF NORTH TEXAS` or `ALL DINING HALLS`
- matches against both `locations.name` and `points_of_interest.name`
- also skips `DISCOVERY PARK BUILDING`, `UNT COLAB`, and `FRISCO LANDING -- UNT AT FRISCO`
- applies explicit venue overrides such as `University Union South Lawn -> University Union`
  and `Library Mall -> Willis Library`
- collapses room-style venue strings to the parent building when possible
- never inserts new `locations`; unresolved venues are skipped
- stores source metadata in `event_details` instead of inflating `events.description`
- writes room/source venue search tags onto imported events
- applies the generated SQL to the configured Postgres database by default
- writes `reports` rows into the generated SQL so admins can review skipped events
  in the admin reports flow and mediate them manually

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
- Frontend API base URL comes from `VITE_API_BASE_URL` (defaults to `http://localhost:4000`).
- Backend CORS origin comes from `FRONTEND_URL` and also allows
  `http://localhost:5173` and `http://127.0.0.1:5173` in dev.
- OSRM rebuilds only when `osrm-data/map.osrm` is missing; see `docs/MAP.md` before deleting files.
- Tooling services behind compose profiles are not started by default; use `docker compose --profile tools ...` when running `osmium`.
- Docker uses `linux/amd64` for DB and OSRM images; Apple Silicon may run under emulation.
