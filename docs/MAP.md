# Map and OSRM Guide

## Responsibilities
- OSRM provides routing over the campus OSM extract.
- PostGIS stores campus locations and POIs.
- Requirements include walking ETA, turn-by-turn steps, and route safety/accessibility.

## Data Location
- OSM extract: `osrm-data/map.osm`
- OSRM artifacts: `osrm-data/map.osrm*`

## OSRM Service (Docker)
The `osrm` service in `compose.yaml`:
- Uses `osrm/osrm-backend` with the `foot.lua` profile.
- Runs `osrm-extract`, `osrm-partition`, and `osrm-customize` if `map.osrm` is missing.
- Serves routes on port 5000 (host port 5001).

Backend uses `OSRM_URL=http://osrm:5000` inside Docker.


## Updating the Campus Map
1. Replace `osrm-data/map.osm` with a new campus extract.
2. Delete `osrm-data/map.osrm*` so OSRM regenerates the graph.
3. Run `docker compose up --build osrm`.

Warning: deleting `map.osrm*` is destructive and can take time to rebuild.

## Routing Details (planned)
- Use `/route/v1/foot` with `steps=true` for turn-by-turn directions.
- Use `geometries=geojson` for drawing polylines on the map.
- OSRM route responses include `duration` for walking ETA.
- Accessibility and safety routing will require extra data layers or custom
  weighting (not implemented yet).

## Known Gaps
- The backend does not yet call OSRM endpoints.
- There are no API endpoints for `locations` or `points_of_interest` yet.
