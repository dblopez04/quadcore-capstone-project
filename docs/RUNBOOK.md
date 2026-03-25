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

## Docker Compose (Proxmox deployment stack)
```bash
docker compose -f compose.proxmox.yaml up -d --build
```
Services:
- `cloudflared` forwards tunnel traffic to `caddy`
- `caddy` serves frontend and proxies `/api/*` and `/docs/*` to backend
- backend, db, and osrm stay on internal Docker networking only

Production verification endpoints (through your public hostname):
- `/healthz`
- `/docs`

## Docker Compose (Proxmox registry-based deploy)
Use this for pull-based deploys:
```bash
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:prod-latest \
CADDY_IMAGE=ghcr.io/<owner>/<repo>-caddy:prod-latest \
docker compose -f compose.proxmox.yaml -f compose.proxmox.images.yaml up -d --no-build backend caddy cloudflared
```

## CI/CD (build-only on `main`)
- Workflow: `.github/workflows/deploy-prod.yml`
- Trigger: push to `main` (and manual `workflow_dispatch`)
- Output: pushes backend and caddy images to GHCR
- Host rollout: handled by `scripts/prod_pull_deploy.sh` + systemd timer on server

## Pull-based auto deploy (server)
One-time setup:
```bash
cp .env.deploy.example .env.deploy
sudo cp deploy/systemd/quadcore-prod-pull-deploy.service /etc/systemd/system/
sudo cp deploy/systemd/quadcore-prod-pull-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now quadcore-prod-pull-deploy.timer
```

Manual run:
```bash
sudo systemctl start quadcore-prod-pull-deploy.service
```

Timer/log checks:
```bash
systemctl list-timers quadcore-prod-pull-deploy.timer
journalctl -u quadcore-prod-pull-deploy.service -n 100 --no-pager
```

## Full rebuild + reseed (destructive)
```bash
./scripts/rebuild.sh --dev
```
This script runs the full reset flow in one command:
- `docker compose down --volumes --remove-orphans --rmi local`
- `docker builder prune -af`
- `docker compose up --build -d`
- `./import_osm_macos.sh`
- `python3 scripts/scrape_unt_events.py`

## Full rebuild (destructive, Proxmox/prod)
```bash
./scripts/rebuild.sh --prod
```
Default prod behavior:
- uses `compose.proxmox.yaml`
- runs map import
- skips event scrape unless `--events` is provided

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
It now waits for Postgres readiness before `osm2pgsql` import and retries
`osm2pgsql` connection attempts automatically.
Set `FORCE_MAP_REFRESH=1` to force a re-download and re-extract before import.
Default extraction box is tuned for UNT main campus:
`-97.165,33.198,-97.142,33.217`.
Override with `DENTON_COBOX=<min_lon,min_lat,max_lon,max_lat>` if needed.
If your machine cannot pull the default osmium image, override it:
`OSMIUM_IMAGE=<image> ./import_osm_macos.sh`
Current default osmium image: `iboates/osmium:latest`.
Optional retry tuning:
- `DB_READY_MAX_ATTEMPTS` (default `60`)
- `DB_READY_RETRY_DELAY_SEC` (default `2`)
- `OSM2PGSQL_RETRIES` (default `3`)

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
- also skips off-campus venue labels such as `DISCOVERY PARK BUILDING`, `UNT COLAB`,
  and `FRISCO LANDING -- UNT AT FRISCO`
- matches against both `locations.name` and `points_of_interest.name`
- applies explicit venue overrides such as `University Union South Lawn -> University Union`
  , `Library Mall -> Willis Library`, and `14C - Sagemore Lawn C -> Sage Hall`
- collapses room-style venue strings to the parent building when possible
- auto-creates a `locations` row for specific unmatched venues when the source page
  includes venue coordinates
- still skips broad/ambiguous venue labels such as `UNIVERSITY OF NORTH TEXAS` and
  `ANY DINING HALL`, plus explicitly ignored off-campus venues
- stores source metadata in `event_details` instead of inflating `events.description`
- writes room/source venue search tags onto imported events
- applies the generated SQL to the configured Postgres database by default
- refreshes `EVENT_IMPORT` reports on each run so the admin review list reflects current matching rules
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
