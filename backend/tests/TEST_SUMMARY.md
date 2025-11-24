# Backend Test Summary

## Overview
Comprehensive test suite covering authentication, user management, and API endpoints with **43 passing tests** across unit and integration testing.

## Test Statistics
- **Total Tests**: 43 ✅
- **Test Suites**: 4
- **Coverage**: Controllers, Middleware, Routes
- **Test Types**: Unit Tests (mocked) + Integration Tests (database)

## Test Files

### 1. User Controller Unit Tests (`user.controller.test.js`)
**Purpose**: Tests user controller functions with mocked database dependencies.

**Tests (15)**:
- ✅ `getProfile` - 2 tests
  - Returns user profile when user exists
  - Returns 404 when user does not exist

- ✅ `getSearchHistory` - 4 tests
  - Returns search history when user is authenticated
  - Returns 403 when access token is missing
  - Returns 403 when user is not found
  - Returns 403 when an error occurs

- ✅ `addSearchToSearchHistory` - 5 tests
  - Adds search to history when valid
  - Returns 403 when access token is missing
  - Returns 403 when search is missing from body
  - Returns 403 when user is not found
  - Handles errors gracefully

- ✅ `clearSearchHistory` - 4 tests
  - Clears search history successfully
  - Returns 403 when access token is missing
  - Returns 403 when user is not found
  - Returns 500 when an error occurs

### 2. Auth Controller Unit Tests (`auth.controller.test.js`)
**Purpose**: Tests authentication controller functions with mocked dependencies.

**Tests (13)**:
- ✅ `register` - 1 test
  - Registers a new user successfully

- ✅ `login` - 4 tests
  - Logs in user successfully with valid credentials
  - Returns 404 when user not found
  - Returns 401 with invalid password
  - Handles errors gracefully

- ✅ `refreshToken` - 4 tests
  - Refreshes access token successfully
  - Returns 401 when no refresh token provided
  - Returns 403 when refresh token is invalid
  - Returns 403 when user not found

- ✅ `logout` - 3 tests
  - Logs out user successfully
  - Logs out even without refresh token
  - Handles errors gracefully

### 3. Auth Middleware Unit Tests (`auth.middleware.test.js`)
**Purpose**: Tests authentication middleware functions.

**Tests (7)**:
- ✅ `verifyToken` - 4 tests
  - Verifies valid token and calls next()
  - Returns 403 when no token provided
  - Returns 401 when token is invalid
  - Returns 401 when token is expired

- ✅ `duplicateRegistration` - 4 tests
  - Calls next() when no duplicate found
  - Returns 400 when email already exists
  - Returns 400 when phone number already exists
  - Prioritizes email duplicate message when both exist

### 4. User Integration Tests (`user.integration.test.js`)
**Purpose**: End-to-end integration tests with actual database operations.

**Tests (8)**:
- ✅ POST `/api/user/profile` - 3 tests
  - Returns user profile with valid token
  - Returns 403 without token
  - Returns 401 with invalid token

- ✅ GET `/api/user/search-history` - 2 tests
  - Returns user search history
  - Returns 403 without access token

- ✅ POST `/api/user/search-history` - 2 tests
  - Adds a new search to history
  - Returns 403 without search term

- ✅ DELETE `/api/user/search-history` - 1 test
  - Clears search history and verifies

## API Documentation

### Swagger Documentation Added
Complete OpenAPI/Swagger documentation has been added to all routes:

#### User Routes (`/api/user/*`)
- ✅ POST `/api/user/profile` - Get user profile
- ✅ GET `/api/user/search-history` - Get search history
- ✅ POST `/api/user/search-history` - Add search to history
- ✅ DELETE `/api/user/search-history` - Clear search history

#### Auth Routes (`/api/auth/*`)
- ✅ POST `/api/auth/register` - Register new user
- ✅ POST `/api/auth/login` - Login user
- ✅ POST `/api/auth/logout` - Logout user
- ✅ POST `/api/auth/refresh` - Refresh access token

**Access Documentation**: Visit `http://localhost:4000/docs` when server is running

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test user.controller.test
```

## Test Configuration

### Environment Variables (in `tests/setup.js`)
- `JWT_SECRET`: test-jwt-secret
- `JWT_REFRESH_SECRET`: test-jwt-refresh-secret
- `DATABASE_URL`: postgres://postgres:postgres@localhost:5433/unt_map

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Timeout: 10 seconds
- Setup file: `tests/setup.js`
- Coverage: Excludes config and node_modules

## Integration Test Requirements
- PostgreSQL database running at `localhost:5433`
- Database schema initialized from `init.sql`
- Docker containers running (`docker compose up`)

## Bug Fixes During Testing
1. ✅ Fixed `refreshToken` scoping issue in user controller
2. ✅ Fixed authentication logic (changed to early return pattern)
3. ✅ Added missing routes for search history endpoints
4. ✅ Updated user model to match database schema
5. ✅ Added `search_history` array field to user model

## Test Coverage Summary

| Component | Coverage |
|-----------|----------|
| Auth Controller | ✅ Complete |
| User Controller | ✅ Complete |
| Auth Middleware | ✅ Complete |
| User Routes | ✅ Complete (Integration) |
| Models | ⚠️  Partial (User model covered) |

## Next Steps
1. Add tests for Student, Faculty, Visitor controllers (when implemented)
2. Add tests for Location/POI endpoints (when implemented)
3. Set up CI/CD pipeline to run tests automatically
4. Add E2E tests with Supertest for full auth flow
5. Increase code coverage to 90%+

## Notes
- Unit tests use mocked dependencies (fast, isolated)
- Integration tests use real database (slower, comprehensive)
- All tests are documented with clear descriptions
- Tests follow AAA pattern (Arrange, Act, Assert)
