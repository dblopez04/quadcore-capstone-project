-- By Luis Pena
CREATE EXTENSION IF NOT EXISTS postgis; -- enabling PostGIS extension for geospatial data and queries.

CREATE TYPE user_role AS ENUM('STUDENT','FACULTY','ADMIN','VISITOR');
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

CREATE TYPE report_status AS ENUM('PENDING', 'IN PROGRESS', 'RESOLVED', 'REJECTED');


CREATE TYPE search_type AS ENUM('POI','EVENT','ROUTE','LOCATION');




CREATE TABLE users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- generating unique IDs
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL, -- enum for user role (student, faculty, visitor, admin)
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
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE locations(
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(Point, 4326) NOT NULL, -- POSTGIS POINT for (Latitude, Longitude)
    building_name VARCHAR(255),
    floor_number INTEGER,
    room_number VARCHAR(50),
    is_indoor BOOLEAN DEFAULT FALSE
);

CREATE TABLE points_of_interest(
    poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category poi_category NOT NULL,
    operating_hours VARCHAR(255),
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true    

);