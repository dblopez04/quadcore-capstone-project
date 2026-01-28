#!/bin/bash

set -e

if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

OSM_DIR="osrm-data"
OSM_FILE="$OSM_DIR/map.osm.pbf"
OSM_DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
NETWORK="quadcore-capstone-project-default"
DB_CONTAINER="db"
DB_HOST="db"
DB_USER="$POSTGRES_USER"
DB_NAME="$POSTGRES_DB"
DB_PASS="$POSTGRES_PASSWORD"

echo "Begin import..."
echo "----------------"

mkdir -p "$OSM_DIR"

if [ ! -f "OSM_FILE" ]; then
    echo "Downloading data from Geofabrik"
    wget -o "$OSM_FILE" "$OSM_DOWNLOAD_URL"
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