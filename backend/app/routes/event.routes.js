const express = require("express");
const router = express.Router();
const controller = require("../controllers/event.controller");
const { verifyToken, requireAdmin } = require("../middleware/auth.middleware");

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
 *     EventTag:
 *       type: object
 *       properties:
 *         event_tag_id:
 *           type: string
 *           format: uuid
 *         name:
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
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventTag'
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
 *         event:
 *           $ref: '#/components/schemas/EventSummary'
 *     EventReminderListResponse:
 *       type: object
 *       properties:
 *         reminders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventReminder'
 *     TagListResponse:
 *       type: object
 *       properties:
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventTag'
 *     CreateTagRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *     AssignTagsRequest:
 *       type: object
 *       required:
 *         - tags
 *       properties:
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *     CreateReminderRequest:
 *       type: object
 *       required:
 *         - remind_at
 *       properties:
 *         remind_at:
 *           type: string
 *           format: date-time
 *         channel:
 *           type: string
 *           description: IN_APP, EMAIL, or SMS
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Search and filter events
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term for title or description
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
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Event type or comma-separated list
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: organizer_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tag names
 *     responses:
 *       200:
 *         description: Events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventListResponse'
 *       400:
 *         description: Invalid date range
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     responses:
 *       200:
 *         description: ICS export
 *         content:
 *           text/calendar:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid date range
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - No token provided
 */
router.get("/bookmarks.ics", verifyToken, controller.exportBookmarkedEventsIcs);

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
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tag names
 *     responses:
 *       200:
 *         description: Bookmarked events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventListResponse'
 *       400:
 *         description: Invalid date range
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event_bookmark_id:
 *                   type: string
 *                   format: uuid
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

/**
 * @swagger
 * /api/events/registrations:
 *   get:
 *     summary: Get registered events for the current user
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
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tag names
 *     responses:
 *       200:
 *         description: Registered events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventListResponse'
 */
router.get("/registrations", verifyToken, controller.getRegistrations);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for an event
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
 *         description: Registered
 *       200:
 *         description: Already registered
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event is at full capacity
 */
router.post("/:eventId/register", verifyToken, controller.registerForEvent);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   delete:
 *     summary: Unregister from an event
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
 *         description: Registration removed
 *       404:
 *         description: Registration not found
 */
router.delete("/:eventId/register", verifyToken, controller.unregisterFromEvent);

/**
 * @swagger
 * /api/events/conflicts:
 *   get:
 *     summary: Detect scheduling conflicts among user events
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
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Comma-separated values of bookmarks or registrations
 *     responses:
 *       200:
 *         description: Conflict pairs returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventConflictsResponse'
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
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Reminders retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventReminderListResponse'
 *       400:
 *         description: Invalid date range
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
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReminderRequest'
 *     responses:
 *       201:
 *         description: Reminder created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event_reminder_id:
 *                   type: string
 *                   format: uuid
 *                 remind_at:
 *                   type: string
 *                   format: date-time
 *                 channel:
 *                   type: string
 *       400:
 *         description: Invalid reminder payload
 *       404:
 *         description: Event not found
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
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder deleted
 *       404:
 *         description: Reminder not found
 */
router.delete("/reminders/:reminderId", verifyToken, controller.deleteReminder);

/**
 * @swagger
 * /api/events/tags:
 *   get:
 *     summary: List event tags
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Tags retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagListResponse'
 */
router.get("/tags", controller.listTags);

/**
 * @swagger
 * /api/events/tags:
 *   post:
 *     summary: Create a new event tag
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTagRequest'
 *     responses:
 *       201:
 *         description: Tag created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventTag'
 *       400:
 *         description: Tag name is required
 *       409:
 *         description: Tag already exists
 */
router.post("/tags", requireAdmin, controller.createTag);

/**
 * @swagger
 * /api/events/{eventId}/tags:
 *   post:
 *     summary: Assign tags to an event
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignTagsRequest'
 *     responses:
 *       201:
 *         description: Tags assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagListResponse'
 *       400:
 *         description: Tags array is required
 *       404:
 *         description: Event not found
 */
router.post("/:eventId/tags", requireAdmin, controller.addTagsToEvent);

/**
 * @swagger
 * /api/events/{eventId}/tags/{tagId}:
 *   delete:
 *     summary: Remove a tag from an event
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
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tag removed
 *       404:
 *         description: Tag assignment not found
 */
router.delete("/:eventId/tags/:tagId", requireAdmin, controller.removeTagFromEvent);

module.exports = router;
