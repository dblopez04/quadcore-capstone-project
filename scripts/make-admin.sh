#!/bin/bash
# Make a user an admin for local development
# Usage: ./scripts/make-admin.sh <email>
# Example: ./scripts/make-admin.sh test@example.com

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/make-admin.sh <email>"
    echo "Example: ./scripts/make-admin.sh test@example.com"
    exit 1
fi

EMAIL="$1"

echo "Making $EMAIL an admin..."

# Get user_id from email
USER_ID=$(docker exec db psql -U postgres -d unt_map -t -c "SELECT user_id FROM users WHERE email = '$EMAIL';" | tr -d ' \n')

if [ -z "$USER_ID" ]; then
    echo "Error: No user found with email $EMAIL"
    exit 1
fi

echo "Found user: $USER_ID"

# Insert into admin table and update user_role
docker exec db psql -U postgres -d unt_map -c "
INSERT INTO admin (user_id) VALUES ('$USER_ID') ON CONFLICT DO NOTHING;
UPDATE users SET user_role = 'ADMIN' WHERE user_id = '$USER_ID';
"

echo "Done! $EMAIL is now an admin."
