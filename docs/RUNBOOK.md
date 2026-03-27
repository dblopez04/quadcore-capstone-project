# Runbook

## Setup
- Copy `.env.example` to `.env`.
- `DATABASE_URL` should point at host Postgres for local backend runs.
- Schema initializes from `database/init.sql` on first DB startup.
- Apply `database/migration_*.sql` manually for existing databases.

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
python3 scripts/scrape_unt_events.py
```

Useful event import flags:
- `--limit <n>`
- `--no-apply`
- `--output -`
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
