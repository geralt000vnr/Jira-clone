const { app, request, signup, setupProject, moveUserToOrg } = require('./helpers');

// Formalizes the admin-override delete behavior added as backend polish: comment/
// attachment/worklog deletion is author-only by default, except a project admin can
// also delete someone else's, resolved via the issue's projectId since those routes
// aren't nested under /projects/:projectId (see services/permissions.js).
describe('comment deletion permissions', () => {
  async function setupIssueWithComment() {
    const { token: adminToken, project, user: adminUser } = await setupProject();
    const { token: authorToken, email: authorEmail, user: authorUser } = await signup();
    const { token: bystanderToken, email: bystanderEmail } = await signup();

    await moveUserToOrg(authorEmail, adminUser.organizationId);
    await moveUserToOrg(bystanderEmail, adminUser.organizationId);
    const authorRelogin = await request(app).post('/api/auth/login').send({ email: authorEmail, password: 'password123' });
    const bystanderRelogin = await request(app)
      .post('/api/auth/login')
      .send({ email: bystanderEmail, password: 'password123' });

    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: authorUser.id, role: 'developer' });

    const issue = (
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ projectId: project._id, title: 'Issue with a comment' })
    ).body.issue;

    const comment = (
      await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .set('Authorization', `Bearer ${authorRelogin.body.token}`)
        .send({ body: 'A comment' })
    ).body.comment;

    return { adminToken, bystanderToken: bystanderRelogin.body.token, comment };
  }

  it('lets a project admin delete a comment they did not author', async () => {
    const { adminToken, comment } = await setupIssueWithComment();
    const res = await request(app).delete(`/api/comments/${comment._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('blocks a non-admin, non-author from deleting a comment', async () => {
    const { bystanderToken, comment } = await setupIssueWithComment();
    const res = await request(app).delete(`/api/comments/${comment._id}`).set('Authorization', `Bearer ${bystanderToken}`);
    expect(res.status).toBe(403);
  });
});
