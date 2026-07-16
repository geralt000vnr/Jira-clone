const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');

beforeAll(async () => {
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
