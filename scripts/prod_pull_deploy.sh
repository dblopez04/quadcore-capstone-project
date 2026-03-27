#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required but was not found on PATH."
    exit 1
fi

if [ -f ".env.deploy" ]; then
    set -a
    # shellcheck disable=SC1091
    source .env.deploy
    set +a
fi

if [ -n "${GHCR_REPOSITORY:-}" ]; then
    BACKEND_IMAGE="${BACKEND_IMAGE:-${GHCR_REPOSITORY}-backend:prod-latest}"
    CADDY_IMAGE="${CADDY_IMAGE:-${GHCR_REPOSITORY}-caddy:prod-latest}"
else
    BACKEND_IMAGE="${BACKEND_IMAGE:-}"
    CADDY_IMAGE="${CADDY_IMAGE:-}"
fi

if [ -z "${BACKEND_IMAGE}" ] || [ -z "${CADDY_IMAGE}" ]; then
    echo "Set BACKEND_IMAGE and CADDY_IMAGE, or set GHCR_REPOSITORY."
    exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-compose.proxmox.yaml}"
COMPOSE_IMAGE_FILE="${COMPOSE_IMAGE_FILE:-compose.proxmox.images.yaml}"
DEPLOY_SERVICES="${DEPLOY_SERVICES:-backend caddy cloudflared}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"
LOCKFILE="${LOCKFILE:-/tmp/quadcore-prod-pull-deploy.lock}"

if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCKFILE"
    if ! flock -n 9; then
        echo "Another deploy run is in progress; skipping."
        exit 0
    fi
fi

if [ -n "${GHCR_TOKEN:-}" ] || [ -n "${GHCR_USERNAME:-}" ]; then
    if [ -z "${GHCR_TOKEN:-}" ] || [ -z "${GHCR_USERNAME:-}" ]; then
        echo "Set both GHCR_USERNAME and GHCR_TOKEN, or neither."
        exit 1
    fi
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin >/dev/null
fi

export BACKEND_IMAGE CADDY_IMAGE

docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_IMAGE_FILE" pull backend caddy
docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_IMAGE_FILE" up -d --no-build $DEPLOY_SERVICES

if [ -n "$HEALTHCHECK_URL" ]; then
    curl --fail --silent --show-error "$HEALTHCHECK_URL" >/dev/null
fi

if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USERNAME:-}" ]; then
    docker logout ghcr.io >/dev/null || true
fi

