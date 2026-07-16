const { app, request, signup, createProject, setupProject, moveUserToOrg } = require('./helpers');

describe('projects', () => {
  it('creates a project and auto-adds the creator as admin', async () => {
    const { token, project } = await setupProject();
    const res = await request(app).get(`/api/projects/${project._id}/members`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].role).toBe('admin');
  });

  it('seeds 3 default workflow statuses on creation', async () => {
    const { statuses } = await setupProject();
    expect(statuses).toHaveLength(3);
    expect(statuses.map((s) => s.category).sort()).toEqual(['done', 'in_progress', 'todo']);
  });

  it('rejects a duplicate project key within the same org', async () => {
    const { token } = await signup();
    await createProject(token, { key: 'DUP' });
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another', key: 'DUP' });

    expect(res.status).toBe(409);
  });

  it('lists only projects the caller is a member of', async () => {
    const { token: tokenA } = await setupProject();
    const { token: tokenB } = await setupProject();

    const resB = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenB}`);
    expect(resB.body.projects).toHaveLength(1);

    const resA = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenA}`);
    expect(resA.body.projects).toHaveLength(1);
    expect(resA.body.projects[0]._id).not.toBe(resB.body.projects[0]._id);
  });

  it('rejects a non-admin from updating the project', async () => {
    const { token: adminToken, project, user: adminUser } = await setupProject();
    const { email: devEmail, user: devUser } = await signup();

    // give the dev user a real membership in the admin's org (see moveUserToOrg's docstring)
    await moveUserToOrg(devEmail, adminUser.organizationId);
    const relogin = await request(app).post('/api/auth/login').send({ email: devEmail, password: 'password123' });
    const devTokenInOrg = relogin.body.token;

    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: devUser.id, role: 'developer' });

    const res = await request(app)
      .patch(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${devTokenInOrg}`)
      .send({ name: 'Renamed by a developer' });

    expect(res.status).toBe(403);
  });

  it('project admin can remove a member', async () => {
    const { token: adminToken, project } = await setupProject();
    const { user: devUser } = await signup();
    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: devUser.id, role: 'developer' });

    const removeRes = await request(app)
      .delete(`/api/projects/${project._id}/members/${devUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removeRes.status).toBe(200);

    const membersRes = await request(app)
      .get(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(membersRes.body.members.find((m) => m.userId?._id === devUser.id)).toBeUndefined();
  });
});
