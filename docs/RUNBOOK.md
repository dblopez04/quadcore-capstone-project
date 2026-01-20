# Runbook

## Setup
- Copy `.env.example` to `.env` and update secrets and credentials.
- The backend reads `DATABASE_URL` from env; Docker sets it to use the `db` service.
- Database schema is initialized from `database/init.sql` on first container start.

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
- Docker uses `linux/amd64` for DB and OSRM images; Apple Silicon may run under emulation.
