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

-- EVENT ENUMS
CREATE TYPE event_type AS ENUM(
    'ACADEMIC',
    'SOCIAL',
    'CAREER FAIR',
    'SPORTS',
    'CULTURAL',
    'WORKSHOP',
    'CONFERENCE',
    'SEMINAR',
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
    event_type event_type NOT NULL,
    organizer_id UUID NOT NULL REFERENCES users(user_id),
    capacity INTEGER CHECK (capacity > 0),
    registered_count INTEGER DEFAULT 0 CHECK (registered_count >= 0),
    is_public BOOLEAN DEFAULT true,
    status event_status DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT end_after_start CHECK (end_date_time > start_date_time),
    CONSTRAINT capacity_check CHECK (registered_count <= capacity)
);

CREATE TABLE event_registrations (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status VARCHAR(50) DEFAULT 'REGISTERED',
    UNIQUE(event_id, user_id)
);

CREATE TABLE event_bookmarks (
    event_bookmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

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
