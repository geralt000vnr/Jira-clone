const { app, request, signup, uniqueEmail } = require('./helpers');

describe('auth', () => {
  it('signs up and returns a token + user', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ orgName: 'Acme', name: 'Ada', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects signup with a duplicate email', async () => {
    const { email } = await signup();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ orgName: 'Another Org', name: 'Someone Else', email, password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects signup with an invalid payload (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ orgName: 'A', name: '', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const { email } = await signup({ password: 'correct-password' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with the wrong password', async () => {
    const { email } = await signup({ password: 'correct-password' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a garbage token', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
