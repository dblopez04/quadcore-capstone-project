-- By Luis Pena
CREATE EXTENSION IF NOT EXISTS postgis; -- enabling PostGIS extension for geospatial data and queries.

CREATE TYPE role AS ENUM('STUDENT','FACULTY','ADMIN','VISITOR');
CREATE TYPE poi_category AS ENUM(
    'ACADEMIC BUILDING',
    'LIBRARY',
    'DINING HALL',
    'PARKING',
    'DORMITORY',
    'RECREATION',
    'MEDICAL',
    'LANDMARK',
    'BATHROOM',
    'RESTAURANT',
    'OTHER'
);

CREATE TYPE event_status AS ENUM(
    'SCHEDULED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED',
    'POSTPONED'
);

--report enums
CREATE TYPE report_type AS ENUM(
    'INCORRECT INFORMATION',
    'MISSING CONTENT',
    'SAFETY ISSUE',
    'ACCESSIBILITY ISSUE',
    'MISSING LOCATION',
    'OTHER'
);

CREATE TYPE report_status AS ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');


CREATE TYPE search_type AS ENUM('POI','EVENT','ROUTE','LOCATION');


CREATE TYPE priority_level AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');




CREATE TABLE users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- generating unique IDs
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    user_role role NOT NULL, -- enum for user role (student, faculty, visitor, admin)
    refresh_token TEXT,
    search_history VARCHAR(255) ARRAY,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') -- email following a regex user@mail.com
);

CREATE TABLE students(
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- If user is deleted, removes record
    euid VARCHAR(10) UNIQUE NOT NULL,
    major VARCHAR(50),
    year INTEGER CHECK(year >= 1 AND year <= 6),
    enrollment_date DATE,
    graduation_date DATE
);

CREATE TABLE faculty(
    faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- If user is deleted, removes record
    euid VARCHAR(10) UNIQUE NOT NULL,
    department VARCHAR(100),
    office_hours VARCHAR(255),
    title VARCHAR(100)
);

CREATE TABLE visitors(
    visitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE -- If user is deleted, removes record
);

CREATE TABLE admin(
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    previous_role role NOT NULL DEFAULT 'VISITOR'
);

CREATE TABLE password_reset_tokens(
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE TABLE locations(
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(Point, 4326) NOT NULL -- POSTGIS POINT for (Latitude, Longitude)
);

CREATE TABLE points_of_interest(
    poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category poi_category NOT NULL,
    building_name VARCHAR(255),
    floor_number INTEGER,
    room_number VARCHAR(50),
    is_indoor BOOLEAN DEFAULT FALSE,
    operating_hours VARCHAR(255),
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true    

);

CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_id UUID NOT NULL REFERENCES locations(location_id),
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    status event_status DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT end_after_start CHECK (end_date_time > start_date_time)
);

CREATE TABLE event_details (
    event_id UUID PRIMARY KEY REFERENCES events(event_id) ON DELETE CASCADE,
    source_url TEXT,
    source_location_name VARCHAR(255),
    room_detail VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_bookmarks (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id),
    UNIQUE(user_id, event_id)
);

CREATE TABLE event_registrations (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status VARCHAR(50) DEFAULT 'REGISTERED',
    UNIQUE(event_id, user_id)
);

CREATE TABLE event_reminders (
    event_reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id, remind_at)
);

CREATE TABLE event_category_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    last_digest_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_type)
);

CREATE INDEX idx_event_category_subscriptions_user_id
    ON event_category_subscriptions(user_id);

CREATE INDEX idx_event_category_subscriptions_event_type
    ON event_category_subscriptions(event_type);

CREATE TABLE location_bookmarks (
    location_bookmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    custom_name VARCHAR(255),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visited TIMESTAMP,
    UNIQUE(user_id, location_id)
);

CREATE TABLE location_lists (
    list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE location_list_items (
    list_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES location_lists(list_id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_id, location_id)
);

CREATE TABLE recently_viewed_locations (
    recent_view_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, location_id)
);

CREATE INDEX idx_location_list_items_list_id ON location_list_items(list_id);
CREATE INDEX idx_recently_viewed_locations_user_viewed_at ON recently_viewed_locations(user_id, viewed_at DESC);

CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(user_id),
    report_type report_type NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location_id UUID REFERENCES locations(location_id),
    priority priority_level DEFAULT 'MEDIUM',
    status report_status DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to UUID REFERENCES admin(admin_id),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES admin(admin_id),
    resolution_notes TEXT
);

-- Demo seed data (from local OSM extract in osrm-data/map.osm)
INSERT INTO locations (name, description, coordinates) VALUES
    ('Ken Bahnsen Gym (MGYM)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15364203636364, 33.20996316363637), 4326)),
    ('Building P (MGVP)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.16197742727273, 33.20118957272728), 4326)),
    ('Waranch Tennis Complex (TENN)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.16034979230768, 33.19927106923077), 4326)),
    ('Environmental Education, Science & Technology (ENV SCI)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15140975322583, 33.21424553225806), 4326)),
    ('Chevron', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15526946, 33.21107752), 4326)),
    ('3 Aguilas Taqueria', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15552372857144, 33.21104785714285), 4326)),
    ('Murchison Performing Arts Center (PAC)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1550760451613, 33.206380216129034), 4326)),
    ('Traditions Hall (TRAD)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15577820000003, 33.210538562295085), 4326)),
    ('Hickory Tree Apartments', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15102547142858, 33.2150731), 4326)),
    ('Support and Services Building (SSB)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1515107, 33.20539002), 4326)),
    ('Pohl Recreation Center (RECS)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15399516842103, 33.21208007631579), 4326)),
    ('Sycamore Hall (SYMR)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14802914313726, 33.21215551960785), 4326)),
    ('Willis Library (LIBR)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14897585599998, 33.210112052), 4326)),
    ('Eagle Student Services Center (ESSC)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.148096515625, 33.210265575), 4326)),
    ('Hurley Administration Building (ADMN)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14850550370369, 33.211195981481474), 4326)),
    ('Business Leadership Building (BLB)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14776077916666, 33.20880338333334), 4326)),
    ('Highland Street Parking Garage (TS)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.145899215, 33.20889504), 4326)),
    ('Maple Hall (MAPL)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14989997352939, 33.20782143235293), 4326)),
    ('Clark Hall (CLAR)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15145095357143, 33.20785103214286), 4326)),
    ('Mean Greens', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15020267777776, 33.20744426666667), 4326)),
    ('Kerr Hall (KERR)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14750513157895, 33.20774482631579), 4326)),
    ('Life Sciences Complex (LIFE)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14892350800001, 33.212179708), 4326)),
    ('General Academic Building (GAB)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1481572285714, 33.213206514285716), 4326)),
    ('Sage Hall (SAGE)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14674833142857, 33.21211798857143), 4326)),
    ('Crumley Hall (CRUM)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14944511363633, 33.209024663636356), 4326)),
    ('Bruce Hall (BRUC)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15009606562502, 33.2120864625), 4326)),
    ('McConnell Hall (MCON)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1515613689655, 33.21230444137931), 4326)),
    ('Chemistry Building (CHEM)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15016671999999, 33.21402330500001), 4326)),
    ('Music Practice North (MPN)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15119062380953, 33.21014712857143), 4326)),
    ('Music Practice South (MPS)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15117594210527, 33.209690168421055), 4326)),
    ('Matthews Hall (MATT)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14663239545456, 33.20988496363637), 4326)),
    ('Wooten Hall (WH)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14567817812501, 33.209869884375), 4326)),
    ('Chilton Hall (CHIL)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1513462357143, 33.21106502857143), 4326)),
    ('Cool Beans', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14594583076925, 33.214824115384616), 4326)),
    ('The Hangar at Crash Pads', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14217822, 33.20731324), 4326)),
    ('Hickory Hall (HKRY)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14794252564104, 33.21425336923077), 4326)),
    ('Language Building (LANG)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14665775000002, 33.214053686363634), 4326)),
    ('Auditorium Building (AUDB)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14727108055556, 33.214000255555554), 4326)),
    ('Curry Hall (CURY)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14665796, 33.21352704666667), 4326)),
    ('Physics Building (PHYS)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14663352666666, 33.213136526666666), 4326)),
    ('Radio, TV, Film & Performing Arts Building (RTFP)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1458471064516, 33.212089106451614), 4326)),
    ('Chestnut Hall (CHNT)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15255414736843, 33.212147994736846), 4326)),
    ('Physical Education Building (PEB)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15292639259258, 33.21096011111111), 4326)),
    ('College Inn (CINN)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15391592, 33.21373932666666), 4326)),
    ('Union Circle Garage', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.1449852111111, 33.21102684444444), 4326)),
    ('Midway Mart', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.13692562857143, 33.21498941428572), 4326)),
    ('Rick''s Beer Barn', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.16122759999999, 33.2106122), 4326)),
    ('Music Annex (MUSA)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.15002755172414, 33.20970868965517), 4326)),
    ('Terrill Hall (TH)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14959134347824, 33.213150939130436), 4326)),
    ('Marquis Hall (MARQ)', 'Seeded from local OSM extract', ST_SetSRID(ST_MakePoint(-97.14892873846154, 33.21318175769231), 4326));
