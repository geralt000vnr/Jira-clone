const { app, request, setupProject } = require('./helpers');

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
});
