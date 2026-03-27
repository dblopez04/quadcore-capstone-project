# Database Guide

## Source of Truth
- Schema lives in `database/init.sql`.
- Existing environments use manual `database/migration_*.sql` files.
- Record schema or contract changes in the affected docs or handoff.

## Runtime Notes
- Postgres host port: `5433`
- Container port: `5432`
- Backend reads `DATABASE_URL`
- `postgis` is enabled; `pgcrypto` is required for UUID generation

## Main Enums
- `role`
- `poi_category`
- `event_type`
- `event_status`
- `report_type`
- `report_status`
- `search_type`

## Main Tables
- Auth: `users`, `students`, `faculty`, `visitors`, `admin`
- Places: `locations`, `points_of_interest`
- Events: `events`, `event_details`, `event_registrations`, `event_bookmarks`, `event_tags`, `event_tag_assignments`, `event_reminders`
- Saved places: `location_bookmarks`, `location_lists`, `location_list_items`, `recently_viewed_locations`
- Reporting: `reports`

## Notes
- Place geometry uses PostGIS `Point` with SRID 4326.
- Primary keys use `gen_random_uuid()`.
- `database/seed_locations.sql` is safe to re-run for demo data.
- `scripts/scrape_unt_events.py` may create missing `locations` rows for matched UNT event venues.
- There is no formal migration framework yet.

## Current Gaps
- Requirements mention closures and richer routing metadata, but those tables are not fully present yet.
