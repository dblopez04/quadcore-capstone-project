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
 *     EventDetails:
 *       type: object
 *       properties:
 *         event_id:
 *           type: string
 *           format: uuid
 *         source_url:
 *           type: string
 *         source_location_name:
 *           type: string
 *         room_detail:
 *           type: string
 *         metadata:
 *           type: object
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
 *         location:
 *           $ref: '#/components/schemas/EventLocationSummary'
 *         details:
 *           $ref: '#/components/schemas/EventDetails'
 *     EventListResponse:
 *       type: object
 *       properties:
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventSummary'
 *     EventConflictItem:
 *       type: object
 *       properties:
 *         event_a:
 *           $ref: '#/components/schemas/EventSummary'
 *         event_b:
 *           $ref: '#/components/schemas/EventSummary'
 *     EventConflictsResponse:
 *       type: object
 *       properties:
 *         conflicts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventConflictItem'
 *     EventReminder:
 *       type: object
 *       properties:
 *         event_reminder_id:
 *           type: string
 *           format: uuid
 *         remind_at:
 *           type: string
 *           format: date-time
 *         channel:
 *           type: string
 *         sent_at:
 *           type: string
 *           format: date-time
 *         event:
 *           $ref: '#/components/schemas/EventSummary'
 *     EventReminderListResponse:
 *       type: object
 *       properties:
 *         reminders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventReminder'
 *     CreateReminderRequest:
 *       type: object
 *       properties:
 *         remind_at:
 *           type: string
 *           format: date-time
 *           description: Required for IN_APP reminders. EMAIL reminders are always scheduled 24 hours before the event starts.
 *         channel:
 *           type: string
 *           description: IN_APP or EMAIL
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Search and filter events
 *     tags:
 *       - Events
 */
router.get("/", controller.getEvents);

/**
 * @swagger
 * /api/events/bookmarks.ics:
 *   get:
 *     summary: Export bookmarked events as ICS
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.get("/bookmarks.ics", verifyToken, controller.exportBookmarkedEventsIcs);

/**
 * @swagger
 * /api/events/bookmarks:
 *   get:
 *     summary: Get bookmarked events for the current user
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.get("/bookmarks", verifyToken, controller.getBookmarkedEvents);

/**
 * @swagger
 * /api/events/registrations:
 *   get:
 *     summary: Get registered events for the current user
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.get("/registrations", verifyToken, controller.getRegistrations);

/**
 * @swagger
 * /api/events/{eventId}/bookmark:
 *   post:
 *     summary: Bookmark an event
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.post("/:eventId/bookmark", verifyToken, controller.bookmarkEvent);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for an event
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.post("/:eventId/register", verifyToken, controller.registerForEvent);

/**
 * @swagger
 * /api/events/{eventId}/bookmark:
 *   delete:
 *     summary: Remove an event bookmark
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.delete("/:eventId/bookmark", verifyToken, controller.removeBookmark);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   delete:
 *     summary: Unregister from an event
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.delete("/:eventId/register", verifyToken, controller.unregisterFromEvent);

/**
 * @swagger
 * /api/events/conflicts:
 *   get:
 *     summary: Detect conflicts among bookmarked and registered events
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.get("/conflicts", verifyToken, controller.getConflicts);

/**
 * @swagger
 * /api/events/reminders:
 *   get:
 *     summary: List reminders for the current user
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.get("/reminders", verifyToken, controller.getReminders);

/**
 * @swagger
 * /api/events/{eventId}/reminders:
 *   post:
 *     summary: Create a reminder for an event
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.post("/:eventId/reminders", verifyToken, controller.createReminder);

/**
 * @swagger
 * /api/events/reminders/{reminderId}:
 *   delete:
 *     summary: Delete a reminder
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 */
router.delete("/reminders/:reminderId", verifyToken, controller.deleteReminder);

module.exports = router;
