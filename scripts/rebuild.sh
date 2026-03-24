#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required but was not found on PATH."
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found on PATH."
    exit 1
fi

if [ -f ".env" ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"

echo "Stopping containers and removing project volumes/images..."
docker compose down --volumes --remove-orphans --rmi local

echo "Pruning Docker build cache..."
docker builder prune -af

echo "Rebuilding and starting services..."
docker compose up --build -d

echo "Waiting for Postgres to become ready..."
for attempt in $(seq 1 60); do
    if docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        echo "Postgres is ready."
        break
    fi

    if [ "$attempt" -eq 60 ]; then
        echo "Postgres did not become ready in time."
        exit 1
    fi

    sleep 2
done

echo "Running map import..."
./import_osm_macos.sh

echo "Scraping and importing UNT events..."
python3 scripts/scrape_unt_events.py

echo "Rebuild flow completed."
