module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/db.setup.js'],
  testTimeout: 15000,
  // tests run sequentially within a file already (supertest + shared app), but run test
  // files themselves one at a time too since they share the same physical test database
  maxWorkers: 1,
};
