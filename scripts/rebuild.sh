#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
    cat <<'USAGE'
Usage: ./scripts/rebuild.sh [--prod|--dev] [--compose-file <path>] [--skip-map-import] [--events] [--skip-events] [--no-prune]

Defaults:
- dev mode uses compose.yaml
- prod mode uses compose.proxmox.yaml
- event import is enabled in dev and disabled in prod
USAGE
}

TARGET="${REBUILD_TARGET:-dev}"
IMPORT_MAP="${REBUILD_IMPORT_MAP:-1}"
IMPORT_EVENTS="${REBUILD_IMPORT_EVENTS:-}"
PRUNE_BUILDER="${REBUILD_PRUNE_BUILDER:-1}"

declare -a COMPOSE_FILES=()

while [ $# -gt 0 ]; do
    case "$1" in
        --prod)
            TARGET="prod"
            shift
            ;;
        --dev)
            TARGET="dev"
            shift
            ;;
        --compose-file)
            if [ $# -lt 2 ]; then
                echo "--compose-file requires a file path"
                exit 1
            fi
            COMPOSE_FILES+=("$2")
            shift 2
            ;;
        --skip-map-import)
            IMPORT_MAP="0"
            shift
            ;;
        --events)
            IMPORT_EVENTS="1"
            shift
            ;;
        --skip-events)
            IMPORT_EVENTS="0"
            shift
            ;;
        --no-prune)
            PRUNE_BUILDER="0"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            usage
            exit 1
            ;;
    esac
done

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required but was not found on PATH."
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found on PATH."
    exit 1
fi

if [ "${#COMPOSE_FILES[@]}" -eq 0 ]; then
    if [ "$TARGET" = "prod" ]; then
        COMPOSE_FILES=("compose.proxmox.yaml")
    else
        COMPOSE_FILES=("compose.yaml")
    fi
fi

if [ -z "$IMPORT_EVENTS" ]; then
    if [ "$TARGET" = "prod" ]; then
        IMPORT_EVENTS="0"
    else
        IMPORT_EVENTS="1"
    fi
fi

for compose_file in "${COMPOSE_FILES[@]}"; do
    if [ ! -f "$compose_file" ]; then
        echo "Compose file not found: $compose_file"
        exit 1
    fi
done

declare -a COMPOSE_ARGS=()
for compose_file in "${COMPOSE_FILES[@]}"; do
    COMPOSE_ARGS+=(-f "$compose_file")
done

dc() {
    docker compose "${COMPOSE_ARGS[@]}" "$@"
}

COMPOSE_FILES_ENV="$(IFS=,; echo "${COMPOSE_FILES[*]}")"

echo "Rebuild target: $TARGET"
echo "Compose files: ${COMPOSE_FILES[*]}"

echo "Stopping containers and removing project volumes/images..."
dc down --volumes --remove-orphans --rmi local

if [ "$PRUNE_BUILDER" = "1" ]; then
    echo "Pruning Docker build cache..."
    docker builder prune -af
fi

echo "Rebuilding and starting services..."
dc up --build -d

echo "Waiting for Postgres to become ready..."
for attempt in $(seq 1 60); do
    if dc exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
        echo "Postgres is ready."
        break
    fi

    if [ "$attempt" -eq 60 ]; then
        echo "Postgres did not become ready in time."
        exit 1
    fi

    sleep 2
done

if [ "$IMPORT_MAP" = "1" ]; then
    echo "Running map import..."
    COMPOSE_FILES="$COMPOSE_FILES_ENV" ./import_osm_macos.sh
else
    echo "Skipping map import (--skip-map-import)."
fi

if [ "$IMPORT_EVENTS" = "1" ]; then
    echo "Scraping and importing UNT events..."
    python3 scripts/scrape_unt_events.py
else
    echo "Skipping event import."
fi

echo "Rebuild flow completed."
