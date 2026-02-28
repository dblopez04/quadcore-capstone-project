const express = require('express');
const router = express.Router();
const controller = require("../controllers/admin.controller");
const { requireAdmin, requireOwner } = require("../middleware/auth.middleware");

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

/**
 * @swagger
 * /api/admin/users/{id}/grant-admin:
 *   post:
 *     summary: Grant admin privileges to a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.post("/users/:id/grant-admin", requireOwner, controller.grantAdmin);

/**
 * @swagger
 * /api/admin/users/{id}/revoke-admin:
 *   post:
 *     summary: Revoke admin privileges from a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.post("/users/:id/revoke-admin", requireOwner, controller.revokeAdmin);

/**
 * @swagger
 * /api/admin/users/{id}/grant-owner:
 *   post:
 *     summary: Grant site owner privileges to an admin user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.post("/users/:id/grant-owner", requireOwner, controller.grantOwner);

/**
 * @swagger
 * /api/admin/users/{id}/revoke-owner:
 *   post:
 *     summary: Revoke site owner privileges from an admin user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.post("/users/:id/revoke-owner", requireOwner, controller.revokeOwner);

module.exports = router;
