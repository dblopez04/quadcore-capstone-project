/**
 * Auth Integration Tests
 *
 * End-to-end integration tests for authentication endpoints with actual database operations.
 * These tests verify the full request/response cycle including middleware,
 * controllers, and database interactions for all auth operations.
 *
 * Test Coverage:
 * - POST /api/auth/register: User registration with validation
 * - POST /api/auth/login: User authentication
 * - POST /api/auth/logout: User logout and token invalidation
 * - POST /api/auth/refresh: Access token refresh
 *
 * Prerequisites:
 * - PostgreSQL database running at localhost:5433
 * - Database schema initialized from init.sql
 * - JWT secrets configured in environment
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const db = require('../app/models');
const authRoutes = require('../app/routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth Integration Tests', () => {
    beforeAll(async () => {
        // Connect to the existing database
        await db.sequelize.authenticate();
    });

    beforeEach(async () => {
        // Clear the users table before each test
        await db.User.destroy({ where: {}, truncate: true, cascade: true });
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'password123',
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '1234567890',
                user_role: 'STUDENT'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully!');
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('newuser@example.com');
            expect(response.body.user.user_role).toBe('STUDENT');

            // Verify cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
            expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);

            // Verify user was created in database
            const user = await db.User.findOne({ where: { email: 'newuser@example.com' } });
            expect(user).not.toBeNull();
            expect(user.first_name).toBe('John');
        });

        it('should register user with minimum required fields', async () => {
            const userData = {
                email: 'minimal@example.com',
                password: 'password123',
                first_name: 'Jane',
                last_name: 'Smith',
                user_role: 'VISITOR'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.user.phone_number).toBeNull();
        });

        it('should support all user roles', async () => {
            const roles = ['STUDENT', 'FACULTY', 'ADMIN', 'VISITOR'];

            for (const role of roles) {
                await db.User.destroy({ where: {}, truncate: true, cascade: true });

                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: `${role.toLowerCase()}@example.com`,
                        password: 'password123',
                        first_name: 'Test',
                        last_name: 'User',
                        user_role: role
                    })
                    .expect(201);

                expect(response.body.user.user_role).toBe(role);
            }
        });

        it('should hash the password before storing', async () => {
            const password = 'mySecurePassword123';

            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'secure@example.com',
                    password: password,
                    first_name: 'Secure',
                    last_name: 'User',
                    user_role: 'STUDENT'
                })
                .expect(201);

            const user = await db.User.findOne({ where: { email: 'secure@example.com' } });
            expect(user.password_hash).not.toBe(password);
            expect(user.password_hash.length).toBeGreaterThan(50);

            // Verify password can be validated
            const isValid = bcrypt.compareSync(password, user.password_hash);
            expect(isValid).toBe(true);
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser;

        beforeEach(async () => {
            // Create a test user
            testUser = await db.User.create({
                email: 'test@example.com',
                password_hash: bcrypt.hashSync('password123', 10),
                first_name: 'Test',
                last_name: 'User',
                phone_number: '1234567890',
                user_role: 'STUDENT'
            });
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');

            // Verify cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
            expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);

            // Verify refresh token was saved in database
            await testUser.reload();
            expect(testUser.refresh_token).toBeDefined();
            expect(testUser.refresh_token).toBe(response.body.refreshToken);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                })
                .expect(404);

            expect(response.body).toHaveProperty('message', 'User not found');
        });

        it('should return 401 for invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('message', 'Invalid Password');
        });

        it('should update refresh token on each login', async () => {
            // First login
            const response1 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            const firstRefreshToken = response1.body.refreshToken;

            // Wait 1 second to ensure different iat timestamp
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Second login
            const response2 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            const secondRefreshToken = response2.body.refreshToken;

            expect(firstRefreshToken).not.toBe(secondRefreshToken);
        });
    });

    describe('POST /api/auth/refresh', () => {
        let testUser;
        let refreshToken;

        beforeEach(async () => {
            // Create user and login to get tokens
            testUser = await db.User.create({
                email: 'test@example.com',
                password_hash: bcrypt.hashSync('password123', 10),
                first_name: 'Test',
                last_name: 'User',
                user_role: 'STUDENT'
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            refreshToken = loginResponse.body.refreshToken;
        });

        it('should refresh access token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Token refreshed successfully');

            // Verify new access token cookie is set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
        });

        it('should return 401 when no refresh token provided', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .expect(401);

            expect(response.body).toHaveProperty('message', 'No token provided');
        });

        it('should return 403 for invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=invalid-token'])
                .expect(403);

            expect(response.body).toHaveProperty('message', 'Invalid or expired refresh token');
        });

        it('should return 403 when refresh token not in database', async () => {
            // Create a valid JWT with non-existent user_id
            const jwt = require('jsonwebtoken');
            const fakeToken = jwt.sign(
                { user_id: '00000000-0000-0000-0000-000000000000' },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${fakeToken}`])
                .expect(403);

            expect(response.body).toHaveProperty('message', 'Invalid refresh token');
        });
    });

    describe('POST /api/auth/logout', () => {
        let testUser;
        let accessToken;
        let refreshToken;

        beforeEach(async () => {
            // Create user and login to get tokens
            testUser = await db.User.create({
                email: 'test@example.com',
                password_hash: bcrypt.hashSync('password123', 10),
                first_name: 'Test',
                last_name: 'User',
                user_role: 'STUDENT'
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            accessToken = loginResponse.body.accessToken;
            refreshToken = loginResponse.body.refreshToken;
        });

        it('should logout successfully and clear tokens', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`
                ])
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Logout successful');

            // Verify refresh token was removed from database
            await testUser.reload();
            expect(testUser.refresh_token).toBeNull();

            // Verify cookies are cleared
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('accessToken=;'))).toBe(true);
            expect(cookies.some(cookie => cookie.includes('refreshToken=;'))).toBe(true);
        });

        it('should return 403 when no access token provided', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(403);

            expect(response.body).toHaveProperty('message', 'No token provided');
        });

        it('should return 401 with invalid access token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['accessToken=invalid-token'])
                .expect(401);

            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });

        it('should still logout even without refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [`accessToken=${accessToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Logout successful');
        });
    });

    describe('Authentication Flow E2E', () => {
        it('should complete full auth flow: register -> login -> refresh -> logout', async () => {
            // Step 1: Register
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'flowtest@example.com',
                    password: 'password123',
                    first_name: 'Flow',
                    last_name: 'Test',
                    user_role: 'STUDENT'
                })
                .expect(201);

            expect(registerResponse.body.user.email).toBe('flowtest@example.com');
            const initialAccessToken = registerResponse.body.accessToken;
            const initialRefreshToken = registerResponse.body.refreshToken;

            // Step 2: Logout from registration session
            await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [`accessToken=${initialAccessToken}`])
                .expect(200);

            // Wait 1 second to ensure different iat timestamp
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'flowtest@example.com',
                    password: 'password123'
                })
                .expect(200);

            const loginAccessToken = loginResponse.body.accessToken;
            const loginRefreshToken = loginResponse.body.refreshToken;

            // Tokens should be different from registration
            expect(loginAccessToken).not.toBe(initialAccessToken);
            expect(loginRefreshToken).not.toBe(initialRefreshToken);

            // Step 4: Refresh token
            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${loginRefreshToken}`])
                .expect(200);

            expect(refreshResponse.body).toHaveProperty('message', 'Token refreshed successfully');

            // Step 5: Final logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [
                    `accessToken=${loginAccessToken}`,
                    `refreshToken=${loginRefreshToken}`
                ])
                .expect(200);

            expect(logoutResponse.body).toHaveProperty('message', 'Logout successful');

            // Step 6: Verify logout - try to refresh with old token (should fail)
            await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${loginRefreshToken}`])
                .expect(403);
        });
    });
});
