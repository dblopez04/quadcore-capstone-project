CREATE EXTENSION IF NOT EXISTS postgis; -- enabling PostGIS extension for geospatial data and queries.

CREATE TABLE users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL, -- enum for user role (student, faculty, visitor)
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
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- If user is deleted, removes record
);