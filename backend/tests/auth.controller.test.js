/**
 * Auth Controller Unit Tests
 *
 * Tests the authentication controller functions with mocked dependencies.
 * Covers registration, login, logout, and token refresh functionality.
 */

const { register, login, logout, refreshToken } = require('../app/controllers/auth.controller');
const db = require('../app/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../app/models');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis()
        };

        // Setup environment variables
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                user_id: 'test-uuid',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                user_role: 'STUDENT',
                update: jest.fn().mockResolvedValue(true)
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'User',
                phone_number: '1234567890',
                user_role: 'STUDENT'
            };

            bcrypt.hashSync.mockReturnValue('hashed-password');
            db.User.create = jest.fn().mockResolvedValue(mockUser);
            jwt.sign = jest.fn()
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            await register(req, res);

            expect(bcrypt.hashSync).toHaveBeenCalledWith('password123', 10);
            expect(db.User.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                password_hash: 'hashed-password',
                first_name: 'Test',
                last_name: 'User',
                phone_number: '1234567890',
                user_role: 'STUDENT'
            });
            expect(mockUser.update).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "User registered successfully!",
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                })
            );
        });
    });

    describe('login', () => {
        it('should login user successfully with valid credentials', async () => {
            const mockUser = {
                user_id: 'test-uuid',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                first_name: 'Test',
                last_name: 'User',
                user_role: 'STUDENT',
                update: jest.fn().mockResolvedValue(true)
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign = jest.fn()
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            await login(req, res);

            expect(db.User.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Login successful"
                })
            );
        });

        it('should return 404 when user not found', async () => {
            req.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            db.User.findOne = jest.fn().mockResolvedValue(null);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('should return 401 with invalid password', async () => {
            const mockUser = {
                user_id: 'test-uuid',
                email: 'test@example.com',
                password_hash: 'hashed-password'
            };

            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({ message: "Invalid Password" });
        });

        it('should handle errors gracefully', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            db.User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });

    describe('refreshToken', () => {
        it('should refresh access token successfully', async () => {
            const mockUser = {
                user_id: 'test-uuid',
                email: 'test@example.com'
            };

            req.cookies.refreshToken = 'valid-refresh-token';

            jwt.verify.mockReturnValue({ user_id: 'test-uuid' });
            db.User.findOne = jest.fn().mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('new-access-token');

            await refreshToken(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
            expect(db.User.findOne).toHaveBeenCalledWith({
                where: {
                    user_id: 'test-uuid',
                    refresh_token: 'valid-refresh-token'
                }
            });
            expect(res.cookie).toHaveBeenCalledWith('accessToken', 'new-access-token', expect.any(Object));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Token refreshed successfully" });
        });

        it('should return 401 when no refresh token provided', async () => {
            req.cookies = {};

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
        });

        it('should return 403 when refresh token is invalid', async () => {
            req.cookies.refreshToken = 'invalid-token';

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
        });

        it('should return 403 when user not found', async () => {
            req.cookies.refreshToken = 'valid-refresh-token';

            jwt.verify.mockReturnValue({ user_id: 'test-uuid' });
            db.User.findOne = jest.fn().mockResolvedValue(null);

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid refresh token" });
        });
    });

    describe('logout', () => {
        it('should logout user successfully', async () => {
            req.cookies.refreshToken = 'valid-refresh-token';

            db.User.update = jest.fn().mockResolvedValue([1]);

            await logout(req, res);

            expect(db.User.update).toHaveBeenCalledWith(
                { refresh_token: null },
                { where: { refresh_token: 'valid-refresh-token' } }
            );
            expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
        });

        it('should logout even without refresh token', async () => {
            req.cookies = {};

            await logout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
        });

        it('should handle errors gracefully', async () => {
            req.cookies.refreshToken = 'valid-refresh-token';

            db.User.update = jest.fn().mockRejectedValue(new Error('Database error'));

            await logout(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });
});
