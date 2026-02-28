#!/bin/bash

set -euo pipefail

if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

required_vars=(POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB)
for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "Missing required environment variable: $var"
        exit 1
    fi
done

OSM_DIR="osrm-data"
OSM_FILE_TEXAS="$OSM_DIR/texas-latest.osm.pbf"
OSM_FILE="$OSM_DIR/map.osm"
OSM_DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
DB_SERVICE="db"
DB_HOST="db"
DB_USER="$POSTGRES_USER"
DB_NAME="$POSTGRES_DB"
DB_PASS="$POSTGRES_PASSWORD"

if [ -n "${OSM2PGSQL_IMAGE:-}" ]; then
    OSM2PGSQL_IMAGES=("$OSM2PGSQL_IMAGE")
else
    OSM2PGSQL_IMAGES=("osm2pgsql/osm2pgsql:latest" "iboates/osm2pgsql:latest")
fi

# Denton coordinate bounding box.
DENTON_COBOX="-97.2,33.1,-97.0,33.3"
echo "Begin import..."
echo "----------------"

mkdir -p "$OSM_DIR"

if [ ! -f "$OSM_FILE_TEXAS" ]; then
    echo "Downloading Texas data from Geofabrik"
    wget -O "$OSM_FILE_TEXAS" "$OSM_DOWNLOAD_URL"
else
    echo "$OSM_FILE_TEXAS already exists"
fi

if [ ! -f "$OSM_FILE" ]; then
    echo "Extracting Denton data from Texas file with compose osmium tool"
    docker compose --profile tools run --rm osmium \
        extract -b "$DENTON_COBOX" /data/texas-latest.osm.pbf -o /data/map.osm --overwrite
    echo "Denton area map extracted"
else
    echo "$OSM_FILE already exists"
fi

echo "Ensuring database service is running..."
docker compose up -d "$DB_SERVICE"

DB_CONTAINER_ID="$(docker compose ps -q "$DB_SERVICE")"
if [ -z "$DB_CONTAINER_ID" ]; then
    echo "Could not find a running container for service: $DB_SERVICE"
    exit 1
fi

NETWORK="$(docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$DB_CONTAINER_ID" | head -n1 | tr -d '[:space:]')"
if [ -z "$NETWORK" ]; then
    echo "Could not detect Docker network for service: $DB_SERVICE"
    exit 1
fi

echo "Setting up database extensions..."
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS hstore;"

echo "Importing into PostGIS db..."
imported=0
for image in "${OSM2PGSQL_IMAGES[@]}"; do
    echo "Trying osm2pgsql image: $image"
    if docker run --rm \
        --network "$NETWORK" \
        -e PGPASSWORD="$DB_PASS" \
        -v "$(pwd)/$OSM_DIR":/data \
        "$image" \
        -H "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --create --slim \
        -G --hstore \
        --latlong \
        --cache 2000 \
        /data/map.osm; then
        imported=1
        break
    fi
    echo "Failed with image: $image"
done

if [ "$imported" -ne 1 ]; then
    echo "Could not run osm2pgsql with any configured image."
    echo "Set OSM2PGSQL_IMAGE to a known-good image and rerun."
    exit 1
fi
echo "OSM data imported into PostGIS db"

echo "Integrating map data locations and POIs"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO locations (name, description, coordinates)
SELECT
    name,
    'Imported from OpenStreetMap',
    ST_Transform(way, 4326)
FROM planet_osm_point
WHERE name IS NOT NULL
AND ST_IsValid(way)
LIMIT 500;

INSERT INTO points_of_interest (location_id, name, description, category, is_indoor)
SELECT l.location_id, l.name, l.description, 'OTHER', FALSE
FROM locations l
WHERE NOT EXISTS (
  SELECT 1 FROM points_of_interest p WHERE p.location_id = l.location_id
);
SQL
echo "Tables updated with map data"
echo "Rebuilding and restarting routing server"
docker compose up -d osrm
echo "Updated with latest data"
echo "DONE"
