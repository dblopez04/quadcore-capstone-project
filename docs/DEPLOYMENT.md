# Proxmox Deployment (Docker + Caddy + Cloudflare Tunnel)

This guide deploys the app with one public hostname through Cloudflare Tunnel.
No app ports are exposed directly on the Proxmox VM.

## Architecture
- `cloudflared` receives traffic from Cloudflare and forwards to `caddy:80`
- Caddy serves frontend static assets and proxies `/api/*` and `/docs/*` to backend
- Backend talks to internal `db` (PostGIS) and `osrm`

## Files
- `compose.proxmox.yaml` - deployment stack for Proxmox
- `compose.proxmox.images.yaml` - image override file for registry-backed deploys
- `deploy/Dockerfile.caddy` - builds frontend assets and packages Caddy
- `deploy/Caddyfile` - same-origin frontend + API proxy rules
- `deploy/cloudflared.config.yml.example` - optional local config template (if not using tunnel token mode)
- `.github/workflows/deploy-prod.yml` - builds and publishes production images on `production` pushes
- `scripts/prod_pull_deploy.sh` - pull latest app images and apply rollout on host
- `deploy/systemd/quadcore-prod-pull-deploy.service` - one-shot deploy service
- `deploy/systemd/quadcore-prod-pull-deploy.timer` - recurring deploy timer
- `.env.deploy.example` - server-side deploy environment template

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

## 3) Start deployment stack (first run)

```bash
docker compose -f compose.proxmox.yaml up -d --build
```

Check status/logs:

```bash
docker compose -f compose.proxmox.yaml ps
docker compose -f compose.proxmox.yaml logs -f cloudflared caddy backend
```

## 4) Configure image build workflow (GitHub)

The workflow builds and pushes backend/caddy images to GHCR on pushes to
`production`.

Required repository setup:
- Ensure `.github/workflows/deploy-prod.yml` exists on the default branch for
  Actions UI visibility.
- Ensure branch trigger matches your deploy branch (`production`).

Required repository permissions:
- GitHub Actions must have permission to write packages.

No SSH secrets are required for the pull-based model.

## 5) Configure pull-based auto deploy on host

On the Proxmox VM:
1. Copy `.env.deploy.example` to `.env.deploy` and set values.
2. Install systemd units.
3. Enable and start timer.

Recommended `.env.deploy` minimum:
- `GHCR_REPOSITORY=ghcr.io/<owner>/<repo>`
- If package visibility is private:
  - `GHCR_USERNAME=<github-user-or-service-user>`
  - `GHCR_TOKEN=<token-with-read:packages>`
- `HEALTHCHECK_URL=https://<your-domain>/healthz`

Install units:

```bash
sudo cp deploy/systemd/quadcore-prod-pull-deploy.service /etc/systemd/system/
sudo cp deploy/systemd/quadcore-prod-pull-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now quadcore-prod-pull-deploy.timer
```

Run one immediate deploy test:

```bash
sudo systemctl start quadcore-prod-pull-deploy.service
sudo systemctl status quadcore-prod-pull-deploy.service --no-pager
```

Inspect timer and logs:

```bash
systemctl list-timers quadcore-prod-pull-deploy.timer
journalctl -u quadcore-prod-pull-deploy.service -n 100 --no-pager
```

## 6) Verify
- App loads at `https://<your-domain>`
- API health responds at `https://<your-domain>/healthz`
- Swagger loads at `https://<your-domain>/docs`
- Login/register sets cookies successfully over HTTPS

## 7) Rollback

Pin older image tags in `.env.deploy`:
- `BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<older-tag>`
- `CADDY_IMAGE=ghcr.io/<owner>/<repo>-caddy:<older-tag>`

Then run:

```bash
sudo systemctl start quadcore-prod-pull-deploy.service
```

## Operational notes
- Keep Postgres and OSRM internal; do not publish their ports publicly.
- Persist `db-data` and `osrm-data/` and back up Postgres regularly.
- Use Proxmox snapshots before major upgrades.
- Restrict `/docs` and admin endpoints with Cloudflare Access/WAF rules when possible.
