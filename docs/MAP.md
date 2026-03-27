# Map and OSRM Guide

## Files
- Source download: `osrm-data/texas-latest.osm.pbf`
- Active extract: `osrm-data/map.osm`
- Generated graph: `osrm-data/map.osrm*`

## Runtime
- `compose.yaml` runs OSRM with the `foot.lua` profile.
- OSRM serves on container port `5000`, exposed locally as `5001`.
- Backend uses `OSRM_URL=http://osrm:5000` inside Docker.

## Refresh Flow
1. Run `./import_osm.sh` or `./import_osm_macos.sh`.
2. Let the script refresh PostGIS data and rebuild OSRM artifacts.
3. Delete `osrm-data/map.osrm*` only when you intentionally want a fresh graph build.

## Notes
- The compose `osmium` service lives behind the `tools` profile.
- macOS import does extra validation and idempotent upserts for locations and POIs.
- Rebuilding OSRM artifacts is slow and destructive.

## Current Gaps
- Backend routing endpoints are not wired to OSRM yet.
- Accessibility/safety weighting is still future work.
