# Proxmox Deployment (Docker + Caddy + Cloudflare Tunnel)

This guide deploys the app with one public hostname through Cloudflare Tunnel.
No app ports are exposed directly on the Proxmox VM.

## Architecture
- `cloudflared` receives traffic from Cloudflare and forwards to `caddy:80`
- Caddy serves frontend static assets and proxies `/api/*` and `/docs/*` to backend
- Backend talks to internal `db` (PostGIS) and `osrm`

## Files
- `compose.proxmox.yaml` - deployment stack for Proxmox
- `deploy/Dockerfile.caddy` - builds frontend assets and packages Caddy
- `deploy/Caddyfile` - same-origin frontend + API proxy rules
- `deploy/cloudflared.config.yml.example` - optional local config template (if not using tunnel token mode)

## 1) Prepare environment
Copy env file and set production values:

```bash
cp .env.example .env
```

Required changes in `.env`:
- `FRONTEND_URL=https://<your-domain>`
- `VITE_API_BASE_URL_PROD=/api`
- `JWT_SECRET=<strong random secret>`
- `JWT_REFRESH_SECRET=<strong random secret>`
- `POSTGRES_PASSWORD=<strong password>`
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=lax`
- `TRUST_PROXY_HOPS=1`
- `CLOUDFLARE_TUNNEL_TOKEN=<tunnel run token>`

## 2) Cloudflare tunnel setup
- Create/confirm a Cloudflare named tunnel.
- Point DNS for your app hostname to that tunnel.
- Use either:
  - token mode (default in `compose.proxmox.yaml`) with `CLOUDFLARE_TUNNEL_TOKEN`
  - or file-based mode with `deploy/cloudflared.config.yml.example` as a template

Ingress target should be `http://caddy:80`.

## 3) Start deployment stack

```bash
docker compose -f compose.proxmox.yaml up -d --build
```

Check status/logs:

```bash
docker compose -f compose.proxmox.yaml ps
docker compose -f compose.proxmox.yaml logs -f cloudflared caddy backend
```

## 4) Verify
- App loads at `https://<your-domain>`
- API health responds at `https://<your-domain>/healthz`
- Swagger loads at `https://<your-domain>/docs`
- Login/register sets cookies successfully over HTTPS

## Operational notes
- Keep Postgres and OSRM internal; do not publish their ports publicly.
- Persist `db-data` and `osrm-data/` and back up Postgres regularly.
- Use Proxmox snapshots before major upgrades.
- Restrict `/docs` and admin endpoints with Cloudflare Access/WAF rules when possible.
