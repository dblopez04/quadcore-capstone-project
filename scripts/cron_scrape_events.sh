#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-compose.proxmox.yaml}"
PSQL_BIN="${PSQL_BIN:-$ROOT_DIR/scripts/psql_docker.sh}"
LOCK_FILE="${LOCK_FILE:-/tmp/unt_events_scrape.lock}"
EVENT_IMPORT_DAYS="${EVENT_IMPORT_DAYS:-120}"
UNT_CALENDAR_URL="${UNT_CALENDAR_URL:-https://calendar.unt.edu/calendar.ics?card_size=small&days=120&experience=inperson}"

run_import() {
    local db_conn

    db_conn="$(
        docker compose -f "$COMPOSE_FILE" exec -T db sh -lc \
            'printf "host=localhost port=5432 dbname=%s user=%s password=%s" "$POSTGRES_DB" "$POSTGRES_USER" "$POSTGRES_PASSWORD"'
    )"

    python3 "$ROOT_DIR/scripts/import_unt_events_ics.py" \
        --calendar-url "$UNT_CALENDAR_URL" \
        --days "$EVENT_IMPORT_DAYS" \
        --psql-bin "$PSQL_BIN" \
        --database-url "$db_conn"
}

if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
        echo "Event import already running; skipping this tick."
        exit 0
    fi
fi

run_import
