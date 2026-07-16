const { app, request, setupProject } = require('./helpers');

async function createIssue(token, projectId, overrides = {}) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId, title: overrides.title || 'An issue', ...overrides });
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.issue;
}

describe('issues', () => {
  it('creates an issue with a transaction-backed sequential key', async () => {
    const { token, project } = await setupProject({ key: 'ENG' });
    const first = await createIssue(token, project._id, { title: 'First' });
    const second = await createIssue(token, project._id, { title: 'Second' });

    expect(first.key).toBe('ENG-1');
    expect(second.key).toBe('ENG-2');
  });

  it('defaults a new issue to the todo-category status', async () => {
    const { token, project, statuses } = await setupProject();
    const issue = await createIssue(token, project._id);
    const todo = statuses.find((s) => s.category === 'todo');
    expect(issue.statusId).toBe(todo._id);
  });

  it('lists issues scoped to the project, with pagination metadata', async () => {
    const { token, project } = await setupProject();
    await createIssue(token, project._id, { title: 'A' });
    await createIssue(token, project._id, { title: 'B' });

    const res = await request(app)
      .get('/api/issues')
      .query({ projectId: project._id, limit: 1, page: 1 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.total).toBe(2);
  });

  it('update rejects a stale version with 409', async () => {
    const { token, project } = await setupProject();
    const issue = await createIssue(token, project._id);

    const first = await request(app)
      .patch(`/api/issues/${issue._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated once', expectedVersion: issue.version });
    expect(first.status).toBe(200);
    expect(first.body.issue.version).toBe(issue.version + 1);

    // reusing the original (now-stale) version should be rejected
    const stale = await request(app)
      .patch(`/api/issues/${issue._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated twice', expectedVersion: issue.version });
    expect(stale.status).toBe(409);
  });

  it('move updates status and logs a human-readable activity entry', async () => {
    const { token, project, statuses } = await setupProject();
    const issue = await createIssue(token, project._id);
    const doneStatus = statuses.find((s) => s.category === 'done');
    const todoStatus = statuses.find((s) => s.category === 'todo');

    const moveRes = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, fromStatusId: todoStatus._id, expectedVersion: 0 });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.issue.statusId).toBe(doneStatus._id);

    const activityRes = await request(app)
      .get(`/api/issues/${issue._id}/activity`)
      .set('Authorization', `Bearer ${token}`);
    expect(activityRes.body.activity).toHaveLength(1);
    expect(activityRes.body.activity[0]).toMatchObject({ field: 'status', fromValue: 'To Do', toValue: 'Done' });
  });

  it('move rejects a stale version with 409', async () => {
    const { token, project, statuses } = await setupProject();
    const issue = await createIssue(token, project._id);
    const doneStatus = statuses.find((s) => s.category === 'done');

    const res = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, expectedVersion: 99 });

    expect(res.status).toBe(409);
  });

  it('soft-deletes an issue and cascades to its subtasks', async () => {
    const { token, project } = await setupProject();
    const parent = await createIssue(token, project._id, { type: 'story', title: 'Parent' });
    const subtask = await createIssue(token, project._id, {
      type: 'subtask',
      title: 'Child',
      parentId: parent._id,
    });

    const deleteRes = await request(app).delete(`/api/issues/${parent._id}`).set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const getSubtask = await request(app).get(`/api/issues/${subtask._id}`).set('Authorization', `Bearer ${token}`);
    expect(getSubtask.status).toBe(404); // req.scope() filters out deletedAt
  });

  describe('bulk operations', () => {
    it('applies per-item and reports partial failures', async () => {
      const { token, project, statuses } = await setupProject();
      const a = await createIssue(token, project._id, { title: 'A' });
      const b = await createIssue(token, project._id, { title: 'B' });
      const inProgress = statuses.find((s) => s.category === 'in_progress');

      const res = await request(app)
        .patch('/api/issues/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { issueId: a._id, expectedVersion: 0 },
            { issueId: b._id, expectedVersion: 99 }, // stale on purpose
          ],
          updates: { statusId: inProgress._id },
        });

      expect(res.status).toBe(200);
      expect(res.body.succeeded).toEqual([a._id]);
      expect(res.body.failed).toEqual([{ issueId: b._id, reason: 'version_conflict' }]);
    });

    it('bulk deletes multiple issues', async () => {
      const { token, project } = await setupProject();
      const a = await createIssue(token, project._id, { title: 'A' });
      const b = await createIssue(token, project._id, { title: 'B' });

      const res = await request(app)
        .delete('/api/issues/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ issueIds: [a._id, b._id] });

      expect(res.status).toBe(200);
      expect(res.body.succeeded).toHaveLength(2);

      const getA = await request(app).get(`/api/issues/${a._id}`).set('Authorization', `Bearer ${token}`);
      expect(getA.status).toBe(404);
    });
  });

  describe('issue links', () => {
    it('shows inverse phrasing from the target issue side', async () => {
      const { token, project } = await setupProject();
      const blocker = await createIssue(token, project._id, { title: 'Blocker' });
      const blocked = await createIssue(token, project._id, { title: 'Blocked' });

      const linkRes = await request(app)
        .post(`/api/issues/${blocker._id}/links`)
        .set('Authorization', `Bearer ${token}`)
        .send({ targetIssueId: blocked._id, type: 'blocks' });
      expect(linkRes.status).toBe(201);

      const fromBlocker = await request(app).get(`/api/issues/${blocker._id}`).set('Authorization', `Bearer ${token}`);
      expect(fromBlocker.body.links[0].label).toBe('blocks');

      const fromBlocked = await request(app).get(`/api/issues/${blocked._id}`).set('Authorization', `Bearer ${token}`);
      expect(fromBlocked.body.links[0].label).toBe('is blocked by');
    });
  });
});
