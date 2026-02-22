const express = require("express");
const router = express.Router();
const controller = require("../controllers/event.controller");
const { verifyToken } = require("../middleware/auth.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     EventLocationSummary:
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
 *           type: string
 *     EventSummary:
 *       type: object
 *       properties:
 *         event_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         start_date_time:
 *           type: string
 *           format: date-time
 *         end_date_time:
 *           type: string
 *           format: date-time
 *         event_type:
 *           type: string
 *         status:
 *           type: string
 *         is_public:
 *           type: boolean
 *         location:
 *           $ref: '#/components/schemas/EventLocationSummary'
 *     EventBookmarkResponse:
 *       type: object
 *       properties:
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventSummary'
 */

/**
 * @swagger
 * /api/events/bookmarks:
 *   get:
 *     summary: Get bookmarked events for the current user
 *     description: Returns events bookmarked by the authenticated user within an optional date range
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range (inclusive)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range (inclusive)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by event status
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *     responses:
 *       200:
 *         description: Bookmarked events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventBookmarkResponse'
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - No token provided
 */
router.get("/bookmarks", verifyToken, controller.getBookmarkedEvents);

/**
 * @swagger
 * /api/events/{eventId}/bookmark:
 *   post:
 *     summary: Bookmark an event
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Event bookmarked
 *       200:
 *         description: Event already bookmarked
 *       404:
 *         description: Event not found
 */
router.post("/:eventId/bookmark", verifyToken, controller.bookmarkEvent);

/**
 * @swagger
 * /api/events/{eventId}/bookmark:
 *   delete:
 *     summary: Remove an event bookmark
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
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
router.delete("/:eventId/bookmark", verifyToken, controller.removeBookmark);

module.exports = router;
