-- Rename enum value
ALTER TYPE report_status RENAME VALUE 'IN PROGRESS' TO 'IN_PROGRESS';
-- Add new enum value
ALTER TYPE report_status ADD VALUE 'CONFIRMED' AFTER 'PENDING';

-- Remove columns from locations
ALTER TABLE locations DROP COLUMN building_name;
ALTER TABLE locations DROP COLUMN floor_number;
ALTER TABLE locations DROP COLUMN room_number;
ALTER TABLE locations DROP COLUMN is_indoor;

-- Add columns to points_of_interest
ALTER TABLE points_of_interest ADD COLUMN building_name VARCHAR(255);
ALTER TABLE points_of_interest ADD COLUMN floor_number INTEGER;
ALTER TABLE points_of_interest ADD COLUMN room_number VARCHAR(50);
ALTER TABLE points_of_interest ADD COLUMN is_indoor BOOLEAN DEFAULT FALSE;
