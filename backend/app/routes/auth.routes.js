const express = require('express');
const router = new express.Router();
const controller = require("../controllers/auth.controller");
const middleware = require("../middleware/auth.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Database ID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         user_role:
 *           type: string
 *           enum: [STUDENT, FACULTY, ADMIN, VISITOR]
 *           description: User's role in the system
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *         - user_role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         phone_number:
 *           type: string
 *           description: User's phone number
 *         user_role:
 *           type: string
 *           enum: [STUDENT, FACULTY, VISITOR]
 *           description: Public registration role (admin assignment is owner-controlled)
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         accessToken:
 *           type: string
 *           description: JWT access token (valid for 30 minutes)
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token (valid for 7 days)
 *         user:
 *           $ref: '#/components/schemas/User'
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns access and refresh tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             student:
 *               summary: Register as a student
 *               value:
 *                 email: student@example.com
 *                 password: securePassword123
 *                 first_name: John
 *                 last_name: Doe
 *                 phone_number: "1234567890"
 *                 user_role: STUDENT
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=abcde12345; HttpOnly; Max-Age=900
 *             description: Sets accessToken and refreshToken cookies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "User registered successfully!"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 1
 *                 user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: "student@example.com"
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 user_role: "STUDENT"
 *       400:
 *         description: Invalid input data (email already in use or phone number already in use)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailInUse:
 *                 summary: Email already in use
 *                 value:
 *                   message: "Email already in use"
 *               phoneInUse:
 *                 summary: Phone number already in use
 *                 value:
 *                   message: "Phone number already in use"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", middleware.duplicateRegistration, controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns access and refresh tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: student@example.com
 *             password: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=abcde12345; HttpOnly; Max-Age=900
 *             description: Sets accessToken and refreshToken cookies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "Login successful"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 1
 *                 user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: "student@example.com"
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 user_role: "STUDENT"
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Invalid Password"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", controller.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the user by clearing tokens and cookies
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Logout successful"
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", middleware.verifyToken, controller.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using the refresh token from cookies
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=abcde12345; HttpOnly; Max-Age=900
 *             description: Sets new accessToken cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Token refreshed successfully"
 *       401:
 *         description: No token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "No token provided"
 *       403:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidToken:
 *                 summary: Invalid refresh token
 *                 value:
 *                   message: "Invalid refresh token"
 *               expiredToken:
 *                 summary: Expired or invalid refresh token
 *                 value:
 *                   message: "Invalid or expired refresh token"
 */
router.post("/refresh", controller.refreshToken);

module.exports = router;
