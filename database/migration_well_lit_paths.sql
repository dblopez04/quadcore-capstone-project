CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS well_lit_paths (
    path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    path_type VARCHAR(50) NOT NULL,
    lighting_level VARCHAR(50) NOT NULL DEFAULT 'GOOD',
    is_preferred BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT well_lit_paths_type_check CHECK (path_type IN ('SIDEWALK', 'STREET', 'CROSSWALK', 'TRAIL', 'OTHER')),
    CONSTRAINT well_lit_paths_lighting_check CHECK (lighting_level IN ('GOOD', 'MODERATE', 'LIMITED'))
);

CREATE INDEX IF NOT EXISTS idx_well_lit_paths_geom ON well_lit_paths USING GIST (geom);
