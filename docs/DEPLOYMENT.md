# Deployment

## Topology
- `cloudflared` exposes one public hostname
- `caddy` serves the frontend and proxies `/api/*` and `/docs/*`
- `backend`, `db`, and `osrm` stay on internal Docker networking

## Key Files
- `compose.proxmox.yaml`
- `compose.proxmox.images.yaml`
- `deploy/Dockerfile.caddy`
- `deploy/Caddyfile`
- `.github/workflows/deploy-prod.yml`
- `scripts/prod_pull_deploy.sh`
- `deploy/systemd/quadcore-prod-pull-deploy.{service,timer}`
- `.env.deploy.example`

## First Deploy
1. Copy `.env.example` to `.env` and set production values.
2. Set `FRONTEND_URL`, JWT secrets, Postgres password, proxy/cookie settings, and `CLOUDFLARE_TUNNEL_TOKEN`.
3. Start the stack:

```bash
docker compose -f compose.proxmox.yaml up -d --build
```

## Pull-Based Deploys
- GitHub Actions publishes backend and caddy images on `main`.
- Host rollout is handled by `scripts/prod_pull_deploy.sh` and the systemd timer.

Setup:
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

## Verify
- App loads at the public hostname
- `https://<host>/healthz` returns OK
- `https://<host>/docs` loads Swagger
- Auth cookies work over HTTPS

## Admin Bootstrap
- Register the initial user through the app first.
- Promote that user with `./scripts/make-admin.sh <email> --owner` from the repo root on the host.
- The script reads `.env`, defaults to `compose.proxmox.yaml`, and updates both the `admin` table and `users.user_role`.
- For local compose usage, override the compose file:

```bash
COMPOSE_FILE=compose.yaml ./scripts/make-admin.sh <email> --owner
```

## Rollback
- Pin older `BACKEND_IMAGE` and `CADDY_IMAGE` values in `.env.deploy`
- Re-run `quadcore-prod-pull-deploy.service`

## Operational Notes
- Keep Postgres and OSRM private.
- Back up database data and keep Proxmox snapshots before risky upgrades.
- Protect `/docs` and admin endpoints with Cloudflare controls when possible.
