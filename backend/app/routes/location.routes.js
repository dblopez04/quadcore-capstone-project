const express = require("express");
const router = express.Router();
const controller = require("../controllers/location.controller");
const { verifyToken } = require("../middleware/auth.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicLocation:
 *       type: object
 *       properties:
 *         location_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         coordinates:
 *           type: object
 *     LocationBookmark:
 *       type: object
 *       properties:
 *         location_bookmark_id:
 *           type: string
 *           format: uuid
 *         custom_name:
 *           type: string
 *         notes:
 *           type: string
 *         is_favorite:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         last_visited:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         location:
 *           $ref: '#/components/schemas/PublicLocation'
 *     CreateLocationBookmarkRequest:
 *       type: object
 *       properties:
 *         custom_name:
 *           type: string
 *         notes:
 *           type: string
 *         is_favorite:
 *           type: boolean
 *     UpdateLocationBookmarkRequest:
 *       type: object
 *       properties:
 *         custom_name:
 *           type: string
 *         notes:
 *           type: string
 *         is_favorite:
 *           type: boolean
 *         last_visited:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get locations
 *     description: Returns location records from Postgres with optional text search.
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive match against name and description
 *     responses:
 *       200:
 *         description: Locations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicLocation'
 */
router.get("/", controller.getLocations);

/**
 * @swagger
 * /api/locations/bookmarks:
 *   get:
 *     summary: Get bookmarked locations for the current user
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: favorite
 *         schema:
 *           type: boolean
 *         description: Filter by favorite status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter bookmarks by location name or description
 *     responses:
 *       200:
 *         description: Bookmarked locations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationBookmark'
 *       400:
 *         description: Invalid query parameter value
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - No token provided
 */
router.get("/bookmarks", verifyToken, controller.getBookmarkedLocations);

/**
 * @swagger
 * /api/locations/{locationId}:
 *   get:
 *     summary: Get location by id
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Location retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   $ref: '#/components/schemas/PublicLocation'
 *       404:
 *         description: Location not found
 */
router.get("/:locationId", controller.getLocationById);

/**
 * @swagger
 * /api/locations/{locationId}/bookmark:
 *   post:
 *     summary: Bookmark a location
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLocationBookmarkRequest'
 *     responses:
 *       201:
 *         description: Location bookmarked
 *       200:
 *         description: Location was already bookmarked (or bookmark metadata updated)
 *       400:
 *         description: Invalid request body value
 *       404:
 *         description: Location not found
 */
router.post("/:locationId/bookmark", verifyToken, controller.bookmarkLocation);

/**
 * @swagger
 * /api/locations/{locationId}/bookmark:
 *   patch:
 *     summary: Update a bookmarked location
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLocationBookmarkRequest'
 *     responses:
 *       200:
 *         description: Bookmark updated
 *       400:
 *         description: Invalid update payload
 *       404:
 *         description: Bookmark not found
 */
router.patch("/:locationId/bookmark", verifyToken, controller.updateBookmark);

/**
 * @swagger
 * /api/locations/{locationId}/bookmark:
 *   delete:
 *     summary: Remove a location bookmark
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookmark removed
 *       404:
 *         description: Bookmark not found
 */
router.delete("/:locationId/bookmark", verifyToken, controller.removeBookmark);

module.exports = router;
