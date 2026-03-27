#!/usr/bin/env bash
# Promote a user to admin privileges in a Docker Compose environment.
# Defaults to the local compose file; override with COMPOSE_FILE=compose.proxmox.yaml for production use.
# Usage: ./scripts/make-admin.sh <email> [--owner]
# Example: ./scripts/make-admin.sh test@example.com --owner

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required but was not found on PATH."
    exit 1
fi

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/make-admin.sh <email> [--owner]"
    echo "Example: ./scripts/make-admin.sh test@example.com --owner"
    exit 1
fi

EMAIL="$1"
OWNER_FLAG="${2:-}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.yaml}"
export COMPOSE_FILE

if [ -f ".env" ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

: "${POSTGRES_USER:?Set POSTGRES_USER in the environment or .env}"
: "${POSTGRES_DB:?Set POSTGRES_DB in the environment or .env}"

if [ -n "$OWNER_FLAG" ] && [ "$OWNER_FLAG" != "--owner" ]; then
    echo "Invalid option: $OWNER_FLAG"
    echo "Usage: ./scripts/make-admin.sh <email> [--owner]"
    exit 1
fi

IS_OWNER_SQL="FALSE"
if [ "$OWNER_FLAG" = "--owner" ]; then
    IS_OWNER_SQL="TRUE"
fi

PSQL=(bash "$ROOT_DIR/scripts/psql_docker.sh" -U "$POSTGRES_USER" -d "$POSTGRES_DB")

echo "Making $EMAIL an admin using $COMPOSE_FILE..."
if [ "$IS_OWNER_SQL" = "TRUE" ]; then
    echo "Owner mode enabled."
fi

USER_ID="$(
    "${PSQL[@]}" -XAt -v ON_ERROR_STOP=1 -v email="$EMAIL" <<'SQL' | tr -d '[:space:]'
SELECT user_id FROM users WHERE email = :'email';
SQL
)"
CURRENT_ROLE="$(
    "${PSQL[@]}" -XAt -v ON_ERROR_STOP=1 -v email="$EMAIL" <<'SQL' | tr -d '[:space:]'
SELECT user_role FROM users WHERE email = :'email';
SQL
)"

if [ -z "$USER_ID" ]; then
    echo "Error: No user found with email $EMAIL"
    exit 1
fi

echo "Found user: $USER_ID"

PREVIOUS_ROLE="$CURRENT_ROLE"
if [ "$PREVIOUS_ROLE" = "ADMIN" ] || [ -z "$PREVIOUS_ROLE" ]; then
    PREVIOUS_ROLE="VISITOR"
fi

"${PSQL[@]}" -v ON_ERROR_STOP=1 \
    -v user_id="$USER_ID" \
    -v previous_role="$PREVIOUS_ROLE" <<SQL
BEGIN;
INSERT INTO admin (user_id, is_owner, previous_role)
VALUES (:'user_id'::uuid, $IS_OWNER_SQL, :'previous_role'::role)
ON CONFLICT (user_id) DO UPDATE SET
    is_owner = CASE
        WHEN EXCLUDED.is_owner THEN TRUE
        ELSE admin.is_owner
    END;
UPDATE users
SET user_role = 'ADMIN'
WHERE user_id = :'user_id'::uuid;
COMMIT;
SQL

if [ "$IS_OWNER_SQL" = "TRUE" ]; then
    echo "Done! $EMAIL is now an admin + owner."
else
    echo "Done! $EMAIL is now an admin."
fi
