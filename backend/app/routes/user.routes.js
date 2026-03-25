const express = require('express');
const router = new express.Router();
const controller = require("../controllers/user.controller");
const middleware = require("../middleware/auth.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchHistoryItem:
 *       type: string
 *       maxLength: 255
 *       description: A search query stored in user's history
 *     SearchHistoryResponse:
 *       type: object
 *       properties:
 *         search_history:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user's search queries
 *     AddSearchRequest:
 *       type: object
 *       required:
 *         - search
 *       properties:
 *         search:
 *           type: string
 *           maxLength: 255
 *           description: Search query to add to history
 */

/**
 * @swagger
 * /api/user/profile:
 *   post:
 *     summary: Get user profile
 *     description: Retrieves the authenticated user's profile information
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: "student@example.com"
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 phone_number: "1234567890"
 *                 user_role: "STUDENT"
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Invalid or expired token"
 *       403:
 *         description: Forbidden - No token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "No token provided"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User not found"
 */
router.post("/profile", middleware.verifyToken, controller.getProfile);

/**
 * @swagger
 * /api/user/profile/email:
 *   patch:
 *     summary: Update reminder email
 *     description: Updates the authenticated user's email address used for account access and reminder delivery
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Invalid email or email already in use
 *       404:
 *         description: User not found
 */
router.patch("/profile/email", middleware.verifyToken, controller.updateEmail);

/**
 * @swagger
 * /api/user/search-history:
 *   get:
 *     summary: Get search history
 *     description: Retrieves the authenticated user's search history
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Search history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchHistoryResponse'
 *             example:
 *               search_history: ["Library Building", "Student Union", "Parking Lot"]
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Invalid or expired token"
 *       403:
 *         description: Forbidden - No token or refresh token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noAccessToken:
 *                 summary: No access token
 *                 value:
 *                   message: "Access Token not found"
 *               noRefreshToken:
 *                 summary: No refresh token
 *                 value:
 *                   message: "Refresh token not found"
 *               userNotFound:
 *                 summary: User not found with refresh token
 *                 value:
 *                   message: "User not found"
 */
router.get("/search-history", middleware.verifyToken, controller.getSearchHistory);

/**
 * @swagger
 * /api/user/search-history:
 *   post:
 *     summary: Add search to history
 *     description: Adds a new search query to the user's search history (prepends to array)
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddSearchRequest'
 *           example:
 *             search: "Discovery Park"
 *     responses:
 *       200:
 *         description: Search added to history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 search_history:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               message: "Added new search to history"
 *               search_history: ["Discovery Park", "Library Building", "Student Union"]
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Invalid or expired token"
 *       403:
 *         description: Forbidden - No token, no search term, or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noAccessToken:
 *                 summary: No access token
 *                 value:
 *                   message: "Access Token not found"
 *               noRefreshToken:
 *                 summary: No refresh token
 *                 value:
 *                   message: "Refresh token not found"
 *               noSearch:
 *                 summary: No search term provided
 *                 value:
 *                   message: "No search found"
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   message: "User not found"
 */
router.post("/search-history", middleware.verifyToken, controller.addSearchToSearchHistory);

/**
 * @swagger
 * /api/user/search-history:
 *   delete:
 *     summary: Clear search history
 *     description: Clears all search queries from the user's search history
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Search history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Search history cleared successfully"
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Invalid or expired token"
 *       403:
 *         description: Forbidden - No token or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noAccessToken:
 *                 summary: No access token
 *                 value:
 *                   message: "Access Token not found"
 *               noRefreshToken:
 *                 summary: No refresh token
 *                 value:
 *                   message: "Refresh token not found"
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   message: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/search-history", middleware.verifyToken, controller.clearSearchHistory);

module.exports = router;
