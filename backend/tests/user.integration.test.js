/**
 * User Integration Tests
 *
 * End-to-end integration tests for user endpoints with actual database operations.
 * These tests verify the full request/response cycle including middleware,
 * controllers, and database interactions.
 *
 * Test Coverage:
 * - POST /api/user/profile: User profile retrieval with JWT authentication
 * - GET /api/user/search-history: Fetching search history with cookie auth
 * - POST /api/user/search-history: Adding searches to history
 * - DELETE /api/user/search-history: Clearing search history
 *
 * Prerequisites:
 * - PostgreSQL database running at localhost:5433
 * - Database schema initialized from init.sql
 * - JWT secrets configured in environment
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../app/models');
const userRoutes = require('../app/routes/user.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/user', userRoutes);

describe('User Integration Tests', () => {
    let testUser;
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
        // Connect to the existing database
        await db.sequelize.authenticate();
    });

    beforeEach(async () => {
        // Clear the users table before each test
        await db.User.destroy({ where: {}, truncate: true, cascade: true });

        // Create a test user
        testUser = await db.User.create({
            email: 'test@example.com',
            password_hash: bcrypt.hashSync('password123', 10),
            first_name: 'Test',
            last_name: 'User',
            phone_number: '1234567890',
            user_role: 'STUDENT',
            search_history: ['initial search']
        });

        // Generate tokens for the test user
        accessToken = jwt.sign(
            { user_id: testUser.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        refreshToken = jwt.sign(
            { user_id: testUser.user_id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update user with refresh token
        await testUser.update({ refresh_token: refreshToken });
    });

    describe('POST /api/user/profile', () => {
        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .post('/api/user/profile')
                .set('Cookie', [`accessToken=${accessToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.first_name).toBe('Test');
            expect(response.body.user.last_name).toBe('User');
        });

        it('should return 403 without token', async () => {
            const response = await request(app)
                .post('/api/user/profile')
                .expect(403);

            expect(response.body).toHaveProperty('message', 'No token provided');
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/api/user/profile')
                .set('Cookie', ['accessToken=invalid-token'])
                .expect(401);

            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });
    });

    describe('Search History Endpoints', () => {
        describe('GET /api/user/search-history', () => {
            it('should return user search history', async () => {
                const response = await request(app)
                    .get('/api/user/search-history')
                    .set('Cookie', [
                        `accessToken=${accessToken}`,
                        `refreshToken=${refreshToken}`
                    ])
                    .expect(200);

                expect(response.body).toHaveProperty('search_history');
                expect(Array.isArray(response.body.search_history)).toBe(true);
                expect(response.body.search_history).toContain('initial search');
            });

            it('should return 403 without access token', async () => {
                const response = await request(app)
                    .get('/api/user/search-history')
                    .expect(403);

                expect(response.body).toHaveProperty('message', 'No token provided');
            });
        });

        describe('POST /api/user/search-history', () => {
            it('should add a new search to history', async () => {
                const response = await request(app)
                    .post('/api/user/search-history')
                    .set('Cookie', [
                        `accessToken=${accessToken}`,
                        `refreshToken=${refreshToken}`
                    ])
                    .send({ search: 'new search term' })
                    .expect(200);

                expect(response.body).toHaveProperty('message', 'Added new search to history');
                expect(response.body.search_history[0]).toBe('new search term');
            });

            it('should return 403 without search term', async () => {
                const response = await request(app)
                    .post('/api/user/search-history')
                    .set('Cookie', [
                        `accessToken=${accessToken}`,
                        `refreshToken=${refreshToken}`
                    ])
                    .send({})
                    .expect(403);

                expect(response.body).toHaveProperty('message', 'No search found');
            });
        });

        describe('DELETE /api/user/search-history', () => {
            it('should clear search history', async () => {
                const response = await request(app)
                    .delete('/api/user/search-history')
                    .set('Cookie', [
                        `accessToken=${accessToken}`,
                        `refreshToken=${refreshToken}`
                    ])
                    .expect(200);

                expect(response.body).toHaveProperty('message', 'Search history cleared successfully');

                // Verify it was actually cleared
                const verifyResponse = await request(app)
                    .get('/api/user/search-history')
                    .set('Cookie', [
                        `accessToken=${accessToken}`,
                        `refreshToken=${refreshToken}`
                    ])
                    .expect(200);

                expect(verifyResponse.body.search_history).toEqual([]);
            });
        });
    });
});
