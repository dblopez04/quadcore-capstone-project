/**
 * User Controller Unit Tests
 *
 * Tests user controller functions with mocked database dependencies.
 * Covers user profile retrieval and search history management (get, add, clear).
 *
 * Test Coverage:
 * - getProfile: User profile retrieval with authentication
 * - getSearchHistory: Fetching user's search history
 * - addSearchToSearchHistory: Adding new searches to history
 * - clearSearchHistory: Clearing all search history
 */

const { getProfile, getSearchHistory, addSearchToSearchHistory, clearSearchHistory } = require('../app/controllers/user.controller');
const db = require('../app/models');
const User = db.User;

// Mock the User model
jest.mock('../app/models', () => ({
    User: {
        findOne: jest.fn()
    }
}));

describe('User Controller', () => {
    let req, res;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mock request and response objects
        req = {
            user_id: 'test-user-id',
            body: {},
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('getProfile', () => {
        it('should return user profile when user exists', async () => {
            const mockUser = {
                user_id: 'test-user-id',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                phone_number: '1234567890',
                user_role: 'STUDENT'
            };

            User.findOne.mockResolvedValue(mockUser);

            await getProfile(req, res);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { user_id: 'test-user-id' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                user: {
                    id: mockUser.user_id,
                    email: mockUser.email,
                    first_name: mockUser.first_name,
                    last_name: mockUser.last_name,
                    phone_number: mockUser.phone_number,
                    user_role: mockUser.user_role
                }
            });
        });

        it('should return 404 when user does not exist', async () => {
            User.findOne.mockResolvedValue(null);

            await getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({ message: "User not found" });
        });
    });

    describe('getSearchHistory', () => {
        it('should return search history when user is authenticated', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            const mockUser = {
                user_id: 'test-user-id',
                search_history: ['search1', 'search2', 'search3']
            };

            User.findOne.mockResolvedValue(mockUser);

            await getSearchHistory(req, res);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { refresh_token: 'valid-refresh-token' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                search_history: mockUser.search_history
            });
        });

        it('should return 403 when access token is missing', async () => {
            req.cookies = {};

            await getSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Access Token not found" });
        });

        it('should return 403 when user is not found', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            User.findOne.mockResolvedValue(null);

            await getSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('should return 403 when an error occurs', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            User.findOne.mockRejectedValue(new Error('Database error'));

            await getSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Could not get search history" });
        });

        it('should return 403 when refresh token is missing', async () => {
            req.cookies = {
                accessToken: 'valid-access-token'
                // no refreshToken
            };

            await getSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Refresh token not found" });
        });
    });

    describe('addSearchToSearchHistory', () => {
        it('should add search to history when valid', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };
            req.body = {
                search: 'new search term'
            };

            const mockUser = {
                user_id: 'test-user-id',
                search_history: ['old search']
            };

            User.findOne.mockResolvedValue(mockUser);

            await addSearchToSearchHistory(req, res);

            expect(mockUser.search_history[0]).toBe('new search term');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                message: "Added new search to history",
                search_history: mockUser.search_history
            });
        });

        it('should return 403 when access token is missing', async () => {
            req.cookies = {};
            req.body = { search: 'test search' };

            await addSearchToSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Access Token not found" });
        });

        it('should return 403 when search is missing from body', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };
            req.body = {};

            const mockUser = {
                user_id: 'test-user-id',
                search_history: []
            };

            User.findOne.mockResolvedValue(mockUser);

            await addSearchToSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "No search found" });
        });

        it('should return 403 when user is not found', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };
            req.body = { search: 'test search' };

            User.findOne.mockResolvedValue(null);

            await addSearchToSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('should handle errors gracefully', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };
            req.body = { search: 'test search' };

            User.findOne.mockRejectedValue(new Error('Database error'));

            await addSearchToSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Could not add to search history" });
        });

        it('should return 403 when refresh token is missing', async () => {
            req.cookies = {
                accessToken: 'valid-access-token'
                // no refreshToken
            };
            req.body = { search: 'test search' };

            await addSearchToSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Refresh token not found" });
        });
    });

    describe('clearSearchHistory', () => {
        it('should clear search history successfully', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            const mockUser = {
                user_id: 'test-user-id',
                search_history: ['search1', 'search2'],
                update: jest.fn().mockResolvedValue(true)
            };

            User.findOne.mockResolvedValue(mockUser);

            await clearSearchHistory(req, res);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { refresh_token: 'valid-refresh-token' }
            });
            expect(mockUser.update).toHaveBeenCalledWith({ search_history: [] });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Search history cleared successfully" });
        });

        it('should return 403 when access token is missing', async () => {
            req.cookies = {};

            await clearSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Access Token not found" });
        });

        it('should return 403 when user is not found', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            User.findOne.mockResolvedValue(null);

            await clearSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('should return 500 when an error occurs', async () => {
            req.cookies = {
                accessToken: 'valid-access-token',
                refreshToken: 'valid-refresh-token'
            };

            const error = new Error('Database error');
            User.findOne.mockRejectedValue(error);

            await clearSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });

        it('should return 403 when refresh token is missing', async () => {
            req.cookies = {
                accessToken: 'valid-access-token'
                // no refreshToken
            };

            await clearSearchHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Refresh token not found" });
        });
    });
});
