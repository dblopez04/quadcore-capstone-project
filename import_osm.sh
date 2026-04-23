#!/bin/bash

set -e

if [ -f ".env" ]; then
    # Strip Windows CRLF to avoid values like "postgres\r" when run via bash on Windows.
    export $(grep -v '^#' .env | sed 's/\r$//' | xargs)
fi

OSM_DIR="osrm-data"
OSM_FILE_TEXAS="$OSM_DIR/texas-latest.osm.pbf"
OSM_FILE="$OSM_DIR/denton-map.osm.pbf"
OSM_DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
NETWORK="quadcore-capstone-project-default"
DB_CONTAINER="db"
DB_HOST="db"
DB_USER="$POSTGRES_USER"
DB_NAME="$POSTGRES_DB"
DB_PASS="$POSTGRES_PASSWORD"
DB_PORT="${POSTGRES_PORT:-5432}"

# UNT main campus + athletics bounding box (min_lon,min_lat,max_lon,max_lat).
DENTON_COBOX="${DENTON_COBOX:--97.165,33.198,-97.142,33.217}"
echo "Begin import..."
echo "----------------"

mkdir -p "$OSM_DIR"

if [ ! -f "OSM_FILE_TEXAS" ]; then
    echo "Downloading Texas data from Geofabrik"
    wget -o "$OSM_FILE_TEXAS" "$OSM_DOWNLOAD_URL"
else
    echo "$OSM_FILE_TEXAS already exists"
fi

if [ ! -f "OSM_FILE" ]; then
    echo "Extracting Denton data from Texas File"
    if command -v osmium >/dev/null 2>&1; then
        osmium extract -b "$DENTON_COBOX" "$OSM_FILE_FULL" -o "$OSM_FILE"
    else
        echo "Using docker for osmium"
        docker run --rm -v "$(pwd)/$OSM_DIR":/data \
            iboates/osmium:latest \
            extract -b "$DENTON_COBOX" /data/texas-latest.osm.pbf -o /data/denton-map.osm.pbf
    fi
    echo "Denton area map extracted"
else
    echo "$OSM_FILE already exists"
fi

echo "Importing into PostGIS db..."
docker run -it --rm \
    --network "$NETWORK" \
    -v "$(pwd)/$OSM_DIR":/data \
    openstreetmap/osm2pgsql \
    -H "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --create --slim \
    -G --hstore \
    --latlong \
    --cache 2000 \
    /data/map.osm.pbf <<EOF
$DB_PASS
EOF
echo "OSM data imported into PostGIS db"

echo "Integrating map data locations and POIs"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'

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
echo "Rebuild and Restarting routing server"
docker-compose up -d osrm
echo "updated with latest data"
echo "DONE"
