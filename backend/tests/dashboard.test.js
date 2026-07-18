const { app, request, setupProject } = require('./helpers');

async function createIssue(token, projectId, overrides = {}) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId, title: overrides.title || 'An issue', ...overrides });
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.issue;
}

describe('dashboard', () => {
  it('returns only issues assigned to the requesting user', async () => {
    const { token, project, user } = await setupProject();
    const unassigned = await createIssue(token, project._id, { title: 'Not mine' });
    const mine = await createIssue(token, project._id, { title: 'Mine' });

    await request(app)
      .patch(`/api/issues/${mine._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: user.id, expectedVersion: mine.version });

    const res = await request(app).get('/api/dashboard/my-issues').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const keys = res.body.issues.map((i) => i._id);
    expect(keys).toContain(mine._id);
    expect(keys).not.toContain(unassigned._id);
    expect(res.body.issues.find((i) => i._id === mine._id).projectId.key).toBe(project.key);
  });

  it('returns recent activity across the org, newest first', async () => {
    const { token, project, statuses } = await setupProject();
    const doneStatus = statuses.find((s) => s.category === 'done');
    const todoStatus = statuses.find((s) => s.category === 'todo');
    const issue = await createIssue(token, project._id);

    await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, fromStatusId: todoStatus._id, expectedVersion: 0 });

    await request(app)
      .patch(`/api/issues/${issue._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'highest', expectedVersion: 1 });

    const res = await request(app).get('/api/dashboard/activity').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.activity.length).toBeGreaterThanOrEqual(2);
    expect(res.body.activity[0].field).toBe('priority'); // most recent change first
    expect(res.body.activity[0].issueId.key).toBe(issue.key);
    const timestamps = res.body.activity.map((a) => new Date(a.createdAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});
