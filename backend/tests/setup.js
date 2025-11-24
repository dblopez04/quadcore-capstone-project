// Jest setup file for test environment configuration
// Override environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
// Use localhost for tests running outside Docker
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5433/unt_map';

// Set timeout for async operations
jest.setTimeout(10000);
