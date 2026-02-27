#!/bin/bash
# Make a user an admin for local development
# Usage: ./scripts/make-admin.sh <email> [--owner]
# Example: ./scripts/make-admin.sh test@example.com --owner

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/make-admin.sh <email> [--owner]"
    echo "Example: ./scripts/make-admin.sh test@example.com --owner"
    exit 1
fi

EMAIL="$1"
OWNER_FLAG="${2:-}"

if [ -n "$OWNER_FLAG" ] && [ "$OWNER_FLAG" != "--owner" ]; then
    echo "Invalid option: $OWNER_FLAG"
    echo "Usage: ./scripts/make-admin.sh <email> [--owner]"
    exit 1
fi

IS_OWNER_SQL="FALSE"
if [ "$OWNER_FLAG" = "--owner" ]; then
    IS_OWNER_SQL="TRUE"
fi

echo "Making $EMAIL an admin..."
if [ "$IS_OWNER_SQL" = "TRUE" ]; then
    echo "Owner mode enabled."
fi

# Get user_id from email
USER_ID=$(docker exec db psql -U postgres -d unt_map -t -c "SELECT user_id FROM users WHERE email = '$EMAIL';" | tr -d ' \n')
CURRENT_ROLE=$(docker exec db psql -U postgres -d unt_map -t -c "SELECT user_role FROM users WHERE email = '$EMAIL';" | tr -d ' \n')

if [ -z "$USER_ID" ]; then
    echo "Error: No user found with email $EMAIL"
    exit 1
fi

echo "Found user: $USER_ID"

PREVIOUS_ROLE="$CURRENT_ROLE"
if [ "$PREVIOUS_ROLE" = "ADMIN" ] || [ -z "$PREVIOUS_ROLE" ]; then
    PREVIOUS_ROLE="VISITOR"
fi

# Insert into admin table and update user_role
docker exec db psql -U postgres -d unt_map -c "
INSERT INTO admin (user_id, is_owner, previous_role)
VALUES ('$USER_ID', $IS_OWNER_SQL, '$PREVIOUS_ROLE')
ON CONFLICT (user_id) DO UPDATE SET
    is_owner = CASE
        WHEN EXCLUDED.is_owner THEN TRUE
        ELSE admin.is_owner
    END;
UPDATE users SET user_role = 'ADMIN' WHERE user_id = '$USER_ID';
"

if [ "$IS_OWNER_SQL" = "TRUE" ]; then
    echo "Done! $EMAIL is now an admin + owner."
else
    echo "Done! $EMAIL is now an admin."
fi
