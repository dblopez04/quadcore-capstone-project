# Admin Privileges Implementation Plan

## Overview

Implement admin-only endpoints for managing locations, POIs, events, reports, and user privileges. This includes a schema migration to improve the data model by moving indoor-related attributes from `locations` to `points_of_interest`.

---

## User Review Required

> [!IMPORTANT]
> **Schema Migration**: This plan includes moving `building_name`, `floor_number`, `room_number`, and `is_indoor` columns from `locations` to `points_of_interest`. Since you have 500 imported records, we'll need to migrate the data.

> [!WARNING]
> **Breaking Change**: Any frontend code that expects `building_name` on locations will need updating.

---

## Proposed Changes

### Schema Migration

#### [MODIFY] [init.sql](file:///Users/daniel/quadcore-capstone-project/database/init.sql)

Update the schema to reflect the new structure:

**`report_status` enum (add CONFIRMED state):**
```sql
CREATE TYPE report_status AS ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
```

- `PENDING` - Report submitted, not yet reviewed
- `CONFIRMED` - Admin verified issue is real (for route-affecting: SAFETY/ACCESSIBILITY)
- `IN_PROGRESS` - Admin working on fix (for data corrections)
- `RESOLVED` - Issue fixed
- `REJECTED` - False report

---

**`locations` table (remove indoor attributes):**
```sql
CREATE TABLE locations(
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(Point, 4326) NOT NULL
);
```

**`points_of_interest` table (add indoor attributes):**
```sql
CREATE TABLE points_of_interest(
    poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category poi_category NOT NULL,
    building_name VARCHAR(255),      -- moved from locations
    floor_number INTEGER,            -- moved from locations
    room_number VARCHAR(50),         -- moved from locations
    is_indoor BOOLEAN DEFAULT FALSE, -- moved from locations
    operating_hours VARCHAR(255),
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true    
);
```

---

### Models

#### [MODIFY] [location.model.js](file:///Users/daniel/quadcore-capstone-project/backend/app/models/location.model.js)

Remove `building_name`, `floor_number`, `room_number`, `is_indoor` from the Location model.

```diff
 module.exports = (sequelize, DataTypes) => {
     const Location = sequelize.define('locations', {
         location_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
         name: { type: DataTypes.STRING(255), allowNull: false },
         description: { type: DataTypes.TEXT, allowNull: true },
-        coordinates: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
-        building_name: { type: DataTypes.STRING(255), allowNull: true },
-        floor_number: { type: DataTypes.INTEGER, allowNull: true },
-        room_number: { type: DataTypes.STRING(50), allowNull: true },
-        is_indoor: { type: DataTypes.BOOLEAN, defaultValue: false }
+        coordinates: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false }
     }, {
         timestamps: false
     });
     return Location;
 }
```

---

#### [MODIFY] [poi.model.js](file:///Users/daniel/quadcore-capstone-project/backend/app/models/poi.model.js)

Add `building_name`, `floor_number`, `room_number`, `is_indoor` to the POI model.

```diff
 module.exports = (sequelize, DataTypes) => {
     const PointOfInterest = sequelize.define('points_of_interest', {
         poi_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
         location_id: { type: DataTypes.UUID, allowNull: false },
         name: { type: DataTypes.STRING(255), allowNull: false },
         description: { type: DataTypes.TEXT, allowNull: true },
         category: {
             type: DataTypes.ENUM(
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
             ),
             allowNull: false
         },
+        building_name: { type: DataTypes.STRING(255), allowNull: true },
+        floor_number: { type: DataTypes.INTEGER, allowNull: true },
+        room_number: { type: DataTypes.STRING(50), allowNull: true },
+        is_indoor: { type: DataTypes.BOOLEAN, defaultValue: false },
         operating_hours: { type: DataTypes.STRING(255), allowNull: true },
         contact_info: { type: DataTypes.TEXT, allowNull: true },
         is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
     }, {
         timestamps: false
     });
     return PointOfInterest;
 }
```

---

### Admin Middleware

#### [MODIFY] [auth.middleware.js](file:///Users/daniel/quadcore-capstone-project/backend/app/middleware/auth.middleware.js)

Add a `requireAdmin` middleware that:
1. First verifies the JWT token (reuses `verifyToken` logic)
2. Checks if the user exists in the `admin` table
3. Returns 403 if not an admin

```js
exports.requireAdmin = async (req, res, next) => {
    // First verify the token
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(403).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Invalid or expired token" });
        }

        req.user_id = decoded.user_id;

        // Check if user is an admin
        const admin = await Admin.findOne({ where: { user_id: decoded.user_id } });
        if (!admin) {
            return res.status(403).send({ message: "Admin privileges required" });
        }

        req.admin_id = admin.admin_id;
        next();
    });
};
```

---

### Admin Controller

#### [NEW] [admin.controller.js](file:///Users/daniel/quadcore-capstone-project/backend/app/controllers/admin.controller.js)

Create a new controller with all admin operations.

**Locations CRUD:**
- `getAllLocations(req, res)` - List all locations with optional search
- `createLocation(req, res)` - Create a new location
- `updateLocation(req, res)` - Update a location by ID
- `deleteLocation(req, res)` - Delete a location by ID

**POIs CRUD:**
- `getAllPois(req, res)` - List all POIs with optional filtering by category
- `createPoi(req, res)` - Create a new POI (requires valid location_id)
- `updatePoi(req, res)` - Update a POI by ID
- `deletePoi(req, res)` - Delete a POI by ID

**Events CRUD:**
- `getAllEvents(req, res)` - List all events with optional status filter
- `createEvent(req, res)` - Create a new event
- `updateEvent(req, res)` - Update an event by ID
- `deleteEvent(req, res)` - Delete an event by ID

**Reports Management:**
- `getAllReports(req, res)` - List all reports with optional status/priority/type filter
- `updateReport(req, res)` - Update report:
  - Change `status` (PENDING → CONFIRMED/IN_PROGRESS → RESOLVED/REJECTED)
  - Assign to admin (`assigned_to`)
  - Update `priority`
  - Add `resolution_notes` when resolving
  - Auto-sets `resolved_at` and `resolved_by` when status becomes RESOLVED
- `deleteReport(req, res)` - Delete a report by ID

**User Admin Management:**
- `getAllUsers(req, res)` - List all users with role info
- `grantAdmin(req, res)` - Add user to admin table
- `revokeAdmin(req, res)` - Remove user from admin table

---

### Admin Routes

#### [NEW] [admin.routes.js](file:///Users/daniel/quadcore-capstone-project/backend/app/routes/admin.routes.js)

Create admin routes with `requireAdmin` middleware on all endpoints.

```
All routes prefixed with /api/admin and protected by requireAdmin middleware

Locations:
  GET    /locations          - List all locations
  POST   /locations          - Create location
  PUT    /locations/:id      - Update location
  DELETE /locations/:id      - Delete location

POIs:
  GET    /pois               - List all POIs
  POST   /pois               - Create POI
  PUT    /pois/:id           - Update POI
  DELETE /pois/:id           - Delete POI

Events:
  GET    /events             - List all events
  POST   /events             - Create event
  PUT    /events/:id         - Update event
  DELETE /events/:id         - Delete event

Reports:
  GET    /reports            - List all reports
  PUT    /reports/:id        - Update report (assign, resolve)
  DELETE /reports/:id        - Delete report

Users:
  GET    /users              - List all users
  POST   /users/:id/grant-admin   - Grant admin privileges
  POST   /users/:id/revoke-admin  - Revoke admin privileges
```

---

### Server Registration

#### [MODIFY] [server.js](file:///Users/daniel/quadcore-capstone-project/backend/server.js)

Register the new admin routes:

```js
const adminRoutes = require('./app/routes/admin.routes');
app.use('/api/admin', adminRoutes);
```

---

## Verification Plan

### Database Migration
1. Run SQL migration to move columns from `locations` to `points_of_interest`
2. Verify data integrity with `SELECT COUNT(*)` queries

### API Testing
Test each endpoint using curl or Postman:

1. **Create a test admin user:**
   - Register a user, then manually insert into `admin` table

2. **Test middleware:**
   - Access admin endpoint without token → 403
   - Access with valid token but non-admin user → 403
   - Access with admin user → 200

3. **Test CRUD operations:**
   - Create, read, update, delete for each resource type
   - Verify FK constraints (e.g., POI requires valid location_id)

4. **Test user management:**
   - Grant admin to a user, verify they can access admin endpoints
   - Revoke admin, verify they lose access

### Automated Tests
**Status:** Implemented in `backend/tests/admin.test.js`

Run tests with:
```bash
cd backend
npm test
```

The test suite covers all verification scenarios above using Jest and Supertest with mocked database models.

---

## File Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `database/init.sql` | Move indoor columns, update report_status enum |
| MODIFY | `backend/app/models/location.model.js` | Remove indoor attributes |
| MODIFY | `backend/app/models/poi.model.js` | Add indoor attributes |
| MODIFY | `backend/app/models/report.model.js` | Update status enum to include CONFIRMED |
| MODIFY | `backend/app/middleware/auth.middleware.js` | Add `requireAdmin` middleware |
| NEW | `backend/app/controllers/admin.controller.js` | All admin CRUD operations |
| NEW | `backend/app/routes/admin.routes.js` | Admin route definitions |
| MODIFY | `backend/server.js` | Register admin routes |
| MODIFY | `import_osm.sh` | Update SQL to match new schema |
| MODIFY | `import_osm_daniel.sh` | Update SQL to match new schema |

---

## Import Script Updates

#### [MODIFY] [import_osm.sh](file:///Users/daniel/quadcore-capstone-project/import_osm.sh)
#### [MODIFY] [import_osm_daniel.sh](file:///Users/daniel/quadcore-capstone-project/import_osm_daniel.sh)

Update the SQL INSERT statements to match the new schema (locations no longer have `is_indoor`):

```diff
-INSERT INTO locations (name, description, coordinates, is_indoor)
+INSERT INTO locations (name, description, coordinates)
 SELECT 
     name,
     'Imported from OpenStreetMap',
-    ST_Transform(way, 4326),
-    FALSE
+    ST_Transform(way, 4326)
 FROM planet_osm_point
 WHERE name IS NOT NULL
 AND ST_IsValid(way)
 LIMIT 500;

-INSERT INTO points_of_interest (location_id, name, description, category)
-SELECT l.location_id, l.name, l.description, 'OTHER'
+INSERT INTO points_of_interest (location_id, name, description, category, is_indoor)
+SELECT l.location_id, l.name, l.description, 'OTHER', FALSE
 FROM locations l
 WHERE NOT EXISTS (
   SELECT 1 FROM points_of_interest p WHERE p.location_id = l.location_id
 );
```
