const express = require('express');
const router = express.Router();
const controller = require("../controllers/admin.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

// Protect all routes with requireAdmin middleware
router.use(requireAdmin);

// Locations
router.get("/locations", controller.getAllLocations);
router.post("/locations", controller.createLocation);
router.put("/locations/:id", controller.updateLocation);
router.delete("/locations/:id", controller.deleteLocation);

// POIs
router.get("/pois", controller.getAllPois);
router.post("/pois", controller.createPoi);
router.put("/pois/:id", controller.updatePoi);
router.delete("/pois/:id", controller.deletePoi);

// Events
router.get("/events", controller.getAllEvents);
router.post("/events", controller.createEvent);
router.put("/events/:id", controller.updateEvent);
router.delete("/events/:id", controller.deleteEvent);

// Reports
router.get("/reports", controller.getAllReports);
router.put("/reports/:id", controller.updateReport);
router.delete("/reports/:id", controller.deleteReport);

// Users
router.get("/users", controller.getAllUsers);
router.post("/users/:id/grant-admin", controller.grantAdmin);
router.post("/users/:id/revoke-admin", controller.revokeAdmin);

module.exports = router;
