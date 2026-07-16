// Runs before the test framework is installed, so config/env.js (which reads
// process.env at require-time) picks these up before anything else requires it.
// Uses a dedicated test database on the same project-local replica set as dev —
// transactions (issue creation) require a replica set, so this can't be a bare mongod.
process.env.MONGO_URI = 'mongodb://localhost:27018/jira-clone-test?replicaSet=rs0';
process.env.JWT_SECRET = 'test-secret-do-not-use-outside-tests';
process.env.PORT = '0';
delete process.env.REDIS_URL; // rate limiting falls back to in-memory for tests
