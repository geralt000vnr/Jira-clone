const { app, request, signup, moveUserToOrg } = require('./helpers');

describe('user email lookup', () => {
  it('finds a user by email within the caller\'s own org', async () => {
    const { token, user } = await signup({ email: 'findme@example.test' });
    const res = await request(app).get('/api/users').query({ email: 'findme@example.test' }).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user.id);
  });

  it('does not leak users from a different org', async () => {
    const { token: callerToken } = await signup();
    const { email: otherEmail } = await signup({ email: 'other-org-user@example.test' });

    const res = await request(app).get('/api/users').query({ email: otherEmail }).set('Authorization', `Bearer ${callerToken}`);
    expect(res.status).toBe(404);
  });

  it('finds a user moved into the same org (sanity-checks the moveUserToOrg test helper itself)', async () => {
    const { token: callerToken, user: caller } = await signup();
    const { email: teammateEmail } = await signup({ email: 'teammate@example.test' });
    await moveUserToOrg(teammateEmail, caller.organizationId);

    const res = await request(app).get('/api/users').query({ email: teammateEmail }).set('Authorization', `Bearer ${callerToken}`);
    expect(res.status).toBe(200);
  });

  it('rejects a non-email query param with 400', async () => {
    const { token } = await signup();
    const res = await request(app).get('/api/users').query({ email: 'not-an-email' }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
