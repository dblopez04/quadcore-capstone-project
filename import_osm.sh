#!/bin/bash

set -euo pipefail

if [ -f ".env" ]; then
    set -a
    # Strip Windows CRLF before sourcing so Bash does not read values like "postgres\r".
    # shellcheck disable=SC1091
    source <(sed 's/\r$//' .env)
    set +a
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
OSM_FILE="$OSM_DIR/denton-map.osm.pbf"
OSM_DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
DB_SERVICE="db"
DB_HOST="db"
DB_USER="$POSTGRES_USER"
DB_NAME="$POSTGRES_DB"
DB_PASS="$POSTGRES_PASSWORD"
DB_PORT="${POSTGRES_PORT:-5432}"

if [ -n "${OSM2PGSQL_IMAGE:-}" ]; then
    OSM2PGSQL_IMAGES=("$OSM2PGSQL_IMAGE")
else
    OSM2PGSQL_IMAGES=("osm2pgsql/osm2pgsql:latest" "iboates/osm2pgsql:latest")
fi

if [ -n "${OSMIUM_IMAGE:-}" ]; then
    OSMIUM_IMAGES=("$OSMIUM_IMAGE")
else
    OSMIUM_IMAGES=("ghcr.io/osmcode/osmium-tool:latest" "iboates/osmium:latest")
fi

# UNT main campus + athletics bounding box (min_lon,min_lat,max_lon,max_lat).
DENTON_COBOX="${DENTON_COBOX:--97.165,33.198,-97.142,33.217}"
FORCE_MAP_REFRESH="${FORCE_MAP_REFRESH:-0}"
echo "Begin import..."
echo "----------------"

mkdir -p "$OSM_DIR"

is_valid_osm_pbf() {
    local path="$1"
    [ -f "$path" ] && file "$path" | grep -q "OpenStreetMap Protocolbuffer Binary Format"
}

extract_map_with_osmium() {
    if command -v osmium >/dev/null 2>&1; then
        echo "Extracting with local osmium binary"
        osmium extract -b "$DENTON_COBOX" "$OSM_FILE_TEXAS" -o "$OSM_FILE" --overwrite
        return 0
    fi

    for image in "${OSMIUM_IMAGES[@]}"; do
        echo "Trying osmium image: $image"
        if docker run --rm -v "$(pwd)/$OSM_DIR":/data "$image" \
            extract -b "$DENTON_COBOX" /data/texas-latest.osm.pbf -o /data/denton-map.osm.pbf --overwrite; then
            return 0
        fi
        echo "Failed with image: $image"
    done

    return 1
}

if [ "$FORCE_MAP_REFRESH" = "1" ] || ! is_valid_osm_pbf "$OSM_FILE_TEXAS"; then
    echo "Downloading Texas data from Geofabrik"
    rm -f "$OSM_FILE_TEXAS"
    if command -v curl >/dev/null 2>&1; then
        curl -L --fail -o "$OSM_FILE_TEXAS" "$OSM_DOWNLOAD_URL"
    elif command -v wget >/dev/null 2>&1; then
        wget -O "$OSM_FILE_TEXAS" "$OSM_DOWNLOAD_URL"
    else
        echo "Error: need curl or wget to download $OSM_DOWNLOAD_URL"
        exit 1
    fi
else
    echo "$OSM_FILE_TEXAS already exists and looks valid"
fi

if [ "$FORCE_MAP_REFRESH" = "1" ] || ! is_valid_osm_pbf "$OSM_FILE"; then
    echo "Extracting Denton data from Texas file"
    if ! extract_map_with_osmium; then
        echo "Could not extract map with local osmium or any configured Docker image."
        echo "Set OSMIUM_IMAGE to a known-good image and rerun."
        exit 1
    fi
    echo "Denton area map extracted"
else
    echo "$OSM_FILE already exists and looks valid"
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
        -P "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --create --slim \
        -G --hstore \
        --latlong \
        --cache 2000 \
        /data/denton-map.osm.pbf; then
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

CREATE TEMP TABLE tmp_osm_features AS
WITH raw_features AS (
    SELECT
        NULLIF(BTRIM(name), '') AS name,
        CASE
            WHEN ST_SRID(way) = 4326 THEN way
            WHEN ST_SRID(way) = 0 THEN ST_SetSRID(way, 4326)
            ELSE ST_Transform(way, 4326)
        END AS geom,
        amenity,
        building,
        shop,
        tourism,
        leisure,
        public_transport,
        highway,
        railway,
        historic,
        tags
    FROM planet_osm_point
    WHERE name IS NOT NULL
      AND ST_IsValid(way)

    UNION ALL

    SELECT
        NULLIF(BTRIM(name), '') AS name,
        CASE
            WHEN ST_SRID(way) = 4326 THEN ST_PointOnSurface(way)
            WHEN ST_SRID(way) = 0 THEN ST_PointOnSurface(ST_SetSRID(way, 4326))
            ELSE ST_PointOnSurface(ST_Transform(way, 4326))
        END AS geom,
        amenity,
        building,
        shop,
        tourism,
        leisure,
        public_transport,
        highway,
        railway,
        historic,
        tags
    FROM planet_osm_polygon
    WHERE name IS NOT NULL
      AND ST_IsValid(way)
),
tagged_features AS (
    SELECT
        name,
        geom,
        COALESCE(LOWER(amenity), LOWER(tags->'amenity'), '') AS amenity,
        COALESCE(LOWER(building), LOWER(tags->'building'), '') AS building,
        COALESCE(LOWER(shop), LOWER(tags->'shop'), '') AS shop,
        COALESCE(LOWER(tourism), LOWER(tags->'tourism'), '') AS tourism,
        COALESCE(LOWER(leisure), LOWER(tags->'leisure'), '') AS leisure,
        COALESCE(LOWER(public_transport), LOWER(tags->'public_transport'), '') AS public_transport,
        COALESCE(LOWER(highway), LOWER(tags->'highway'), '') AS highway,
        COALESCE(LOWER(railway), LOWER(tags->'railway'), '') AS railway,
        COALESCE(LOWER(historic), LOWER(tags->'historic'), '') AS historic,
        COALESCE(LOWER(tags->'parking'), '') AS parking,
        COALESCE(LOWER(tags->'indoor'), '') AS indoor,
        COALESCE(tags->'opening_hours', '') AS opening_hours,
        COALESCE(tags->'phone', tags->'contact:phone', '') AS phone,
        COALESCE(tags->'website', tags->'contact:website', '') AS website
    FROM raw_features
    WHERE name IS NOT NULL
      AND ST_IsValid(geom)
),
deduped_features AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(name), ROUND(ST_X(geom)::numeric, 6), ROUND(ST_Y(geom)::numeric, 6)
            ORDER BY name
        ) AS rn
    FROM tagged_features
    WHERE name <> ''
)
SELECT
    name,
    geom,
    CASE
        WHEN amenity = 'library' THEN 'LIBRARY'
        WHEN amenity IN ('canteen', 'food_court') THEN 'DINING HALL'
        WHEN amenity IN ('restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream') THEN 'RESTAURANT'
        WHEN amenity = 'parking' OR parking <> '' THEN 'PARKING'
        WHEN amenity IN ('hospital', 'clinic', 'doctors', 'dentist', 'pharmacy') THEN 'MEDICAL'
        WHEN amenity = 'toilets' THEN 'BATHROOM'
        WHEN building IN ('dormitory', 'residential') OR amenity IN ('dormitory', 'student_housing') THEN 'DORMITORY'
        WHEN tourism IN ('museum', 'gallery', 'artwork', 'attraction', 'viewpoint', 'memorial') OR historic <> '' THEN 'LANDMARK'
        WHEN highway = 'bus_stop' OR public_transport IN ('platform', 'stop_position', 'station') THEN 'LANDMARK'
        WHEN leisure <> '' OR amenity IN ('sports_centre', 'gym') THEN 'RECREATION'
        WHEN building <> '' OR amenity IN ('university', 'college', 'school', 'classroom') THEN 'ACADEMIC BUILDING'
        ELSE 'OTHER'
    END AS category,
    CASE
        WHEN indoor = 'yes' OR building <> '' THEN TRUE
        ELSE FALSE
    END AS is_indoor,
    NULLIF(building, '') AS building_name,
    NULLIF(opening_hours, '') AS operating_hours,
    NULLIF(CONCAT_WS(' | ', NULLIF(phone, ''), NULLIF(website, '')), '') AS contact_info
FROM deduped_features
WHERE rn = 1
  AND (
      amenity <> ''
      OR building <> ''
      OR shop <> ''
      OR tourism <> ''
      OR leisure <> ''
      OR public_transport <> ''
      OR highway = 'bus_stop'
      OR railway <> ''
      OR historic <> ''
      OR parking <> ''
  );

INSERT INTO locations (name, description, coordinates)
SELECT
    f.name,
    'Imported from OpenStreetMap',
    ST_SetSRID(ST_MakePoint(ST_X(f.geom), ST_Y(f.geom)), 4326)
FROM tmp_osm_features f
WHERE NOT EXISTS (
    SELECT 1
    FROM locations l
    WHERE LOWER(l.name) = LOWER(f.name)
      AND ROUND(ST_X(l.coordinates)::numeric, 6) = ROUND(ST_X(f.geom)::numeric, 6)
      AND ROUND(ST_Y(l.coordinates)::numeric, 6) = ROUND(ST_Y(f.geom)::numeric, 6)
);

CREATE TEMP TABLE tmp_osm_feature_locations AS
SELECT
    l.location_id,
    f.name,
    f.category,
    f.is_indoor,
    f.building_name,
    f.operating_hours,
    f.contact_info
FROM tmp_osm_features f
JOIN locations l
  ON LOWER(l.name) = LOWER(f.name)
 AND ROUND(ST_X(l.coordinates)::numeric, 6) = ROUND(ST_X(f.geom)::numeric, 6)
 AND ROUND(ST_Y(l.coordinates)::numeric, 6) = ROUND(ST_Y(f.geom)::numeric, 6);

UPDATE points_of_interest p
SET
    category = fl.category::poi_category,
    is_indoor = COALESCE(p.is_indoor, FALSE) OR fl.is_indoor,
    building_name = COALESCE(p.building_name, fl.building_name),
    operating_hours = COALESCE(p.operating_hours, fl.operating_hours),
    contact_info = COALESCE(p.contact_info, fl.contact_info),
    description = CASE
        WHEN p.description IS NULL OR p.description = '' OR p.description = 'Seeded from local OSM extract'
        THEN 'Imported from OpenStreetMap'
        ELSE p.description
    END,
    is_active = COALESCE(p.is_active, TRUE)
FROM tmp_osm_feature_locations fl
WHERE p.location_id = fl.location_id
  AND LOWER(p.name) = LOWER(fl.name)
  AND p.category = 'OTHER';

INSERT INTO points_of_interest (
    location_id,
    name,
    description,
    category,
    is_indoor,
    building_name,
    operating_hours,
    contact_info,
    is_active
)
SELECT
    fl.location_id,
    fl.name,
    'Imported from OpenStreetMap',
    fl.category::poi_category,
    fl.is_indoor,
    fl.building_name,
    fl.operating_hours,
    fl.contact_info,
    TRUE
FROM tmp_osm_feature_locations fl
WHERE NOT EXISTS (
    SELECT 1
    FROM points_of_interest p
    WHERE p.location_id = fl.location_id
      AND LOWER(p.name) = LOWER(fl.name)
);

DROP TABLE IF EXISTS tmp_osm_feature_locations;
DROP TABLE IF EXISTS tmp_osm_features;
SQL
echo "Tables updated with map data"
echo "Rebuilding and restarting routing server"
docker compose up -d osrm
echo "Updated with latest data"
echo "DONE"
