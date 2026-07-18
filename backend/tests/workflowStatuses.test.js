const { app, request, setupProject } = require('./helpers');

async function createIssue(token, projectId, overrides = {}) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId, title: overrides.title || 'An issue', ...overrides });
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.issue;
}

describe('workflow statuses', () => {
  it('creates a custom status and appends it after existing ones', async () => {
    const { token, project, statuses } = await setupProject();
    const res = await request(app)
      .post(`/api/projects/${project._id}/workflow-statuses`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'In Review', category: 'in_progress', color: 'amber' });

    expect(res.status).toBe(201);
    expect(res.body.status.order).toBe(statuses.length); // appended after the 3 defaults (orders 0,1,2)
  });

  it('blocks deleting a status that issues still use', async () => {
    const { token, project, statuses } = await setupProject();
    const todo = statuses.find((s) => s.category === 'todo');

    await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: project._id, title: 'Uses the default status' });

    const deleteRes = await request(app)
      .delete(`/api/projects/${project._id}/workflow-statuses/${todo._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(409);
  });

  it('allows deleting a status once nothing references it', async () => {
    const { token, project, statuses } = await setupProject();
    const doneStatus = statuses.find((s) => s.category === 'done');

    const res = await request(app)
      .delete(`/api/projects/${project._id}/workflow-statuses/${doneStatus._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('blocks a move to a status not in allowedTransitions', async () => {
    const { token, project, statuses } = await setupProject();
    const todo = statuses.find((s) => s.category === 'todo');
    const inProgress = statuses.find((s) => s.category === 'in_progress');
    const done = statuses.find((s) => s.category === 'done');

    await request(app)
      .patch(`/api/projects/${project._id}/workflow-statuses/${todo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ allowedTransitions: [inProgress._id] });

    const issue = await createIssue(token, project._id); // starts in todo

    const res = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: done._id, toPosition: 0, fromStatusId: todo._id, expectedVersion: 0 });

    expect(res.status).toBe(400);
  });

  it('allows a move once the target status is added to allowedTransitions', async () => {
    const { token, project, statuses } = await setupProject();
    const todo = statuses.find((s) => s.category === 'todo');
    const inProgress = statuses.find((s) => s.category === 'in_progress');

    await request(app)
      .patch(`/api/projects/${project._id}/workflow-statuses/${todo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ allowedTransitions: [inProgress._id] });

    const issue = await createIssue(token, project._id);

    const res = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: inProgress._id, toPosition: 0, fromStatusId: todo._id, expectedVersion: 0 });

    expect(res.status).toBe(200);
    expect(res.body.issue.statusId).toBe(inProgress._id);
  });
});
