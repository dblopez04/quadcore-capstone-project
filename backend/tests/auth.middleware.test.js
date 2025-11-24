/**
 * Auth Middleware Unit Tests
 *
 * Tests authentication middleware functions including token verification
 * and duplicate registration checks.
 */

const { verifyToken, duplicateRegistration } = require('../app/middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const db = require('../app/models');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../app/models');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            cookies: {},
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        process.env.JWT_SECRET = 'test-secret';
    });

    describe('verifyToken', () => {
        it('should verify valid token and call next()', () => {
            req.cookies.accessToken = 'valid-token';

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { user_id: 'test-user-id' });
            });

            verifyToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(
                'valid-token',
                process.env.JWT_SECRET,
                expect.any(Function)
            );
            expect(req.user_id).toBe('test-user-id');
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 when no token provided', () => {
            req.cookies = {};

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({ message: "No token provided" });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is invalid', () => {
            req.cookies.accessToken = 'invalid-token';

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Invalid token'), null);
            });

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({ message: "Invalid or expired token" });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is expired', () => {
            req.cookies.accessToken = 'expired-token';

            jwt.verify.mockImplementation((token, secret, callback) => {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                callback(error, null);
            });

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({ message: "Invalid or expired token" });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('duplicateRegistration', () => {
        it('should call next() when no duplicate found', async () => {
            req.body = {
                email: 'new@example.com',
                phone_number: '1234567890'
            };

            db.User.findOne = jest.fn().mockResolvedValue(null);

            await duplicateRegistration(req, res, next);

            expect(db.User.findOne).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 400 when email already exists', async () => {
            req.body = {
                email: 'existing@example.com',
                phone_number: '1234567890'
            };

            const mockUser = {
                email: 'existing@example.com',
                phone_number: '0987654321'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);

            await duplicateRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Email already in use"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when phone number already exists', async () => {
            req.body = {
                email: 'new@example.com',
                phone_number: '1234567890'
            };

            const mockUser = {
                email: 'other@example.com',
                phone_number: '1234567890'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);

            await duplicateRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Phone number already in use"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should prioritize email duplicate message when both exist', async () => {
            req.body = {
                email: 'existing@example.com',
                phone_number: '1234567890'
            };

            const mockUser = {
                email: 'existing@example.com',
                phone_number: '1234567890'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);

            await duplicateRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Email already in use"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next() when user found but neither email nor phone match', async () => {
            req.body = {
                email: 'new@example.com',
                phone_number: '1111111111'
            };

            const mockUser = {
                email: 'different@example.com',
                phone_number: '2222222222'
            };

            db.User.findOne = jest.fn().mockResolvedValue(mockUser);

            await duplicateRegistration(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
