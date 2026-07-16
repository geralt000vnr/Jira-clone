const { app, request, uniqueEmail } = require('./helpers');

// Jest gives each test file its own module registry, so the authLimiter middleware
// (a module-level singleton) starts with a fresh in-memory counter here — isolated
// from the auth attempts made in auth.test.js.
describe('auth rate limiting', () => {
  it('blocks after 10 auth attempts within the window', async () => {
    const email = uniqueEmail();
    let lastStatus;
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(401); // the 10th attempt is still allowed through

    const blocked = await request(app).post('/api/auth/login').send({ email, password: 'wrong' });
    expect(blocked.status).toBe(429);
  });
});
