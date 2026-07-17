const { app, request, setupProject } = require('./helpers');

async function createIssue(token, projectId, overrides = {}) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId, title: overrides.title || 'An issue', ...overrides });
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.issue;
}

describe('roadmap', () => {
  it('returns epics with their date range and child-issue progress counts', async () => {
    const { token, project, statuses } = await setupProject();
    const doneStatus = statuses.find((s) => s.category === 'done');

    const epic = await createIssue(token, project._id, { type: 'epic', title: 'Big Epic' });
    await request(app)
      .patch(`/api/issues/${epic._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2026-01-01T00:00:00.000Z',
        dueDate: '2026-02-01T00:00:00.000Z',
        expectedVersion: 0,
      });

    const child1 = await createIssue(token, project._id, { type: 'story', title: 'Child 1', parentId: epic._id });
    const child2 = await createIssue(token, project._id, { type: 'story', title: 'Child 2', parentId: epic._id });

    await request(app)
      .patch(`/api/issues/${child1._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, expectedVersion: 0 });

    const res = await request(app)
      .get(`/api/projects/${project._id}/roadmap`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.epics).toHaveLength(1);
    const roadmapEpic = res.body.epics[0];
    expect(roadmapEpic.key).toBe(epic.key);
    expect(roadmapEpic.startDate).toBe('2026-01-01T00:00:00.000Z');
    expect(roadmapEpic.dueDate).toBe('2026-02-01T00:00:00.000Z');
    expect(roadmapEpic.totalChildren).toBe(2);
    expect(roadmapEpic.doneChildren).toBe(1);
    void child2;
  });

  it('returns an epic with zero counts when it has no children yet', async () => {
    const { token, project } = await setupProject();
    const epic = await createIssue(token, project._id, { type: 'epic', title: 'Empty Epic' });

    const res = await request(app)
      .get(`/api/projects/${project._id}/roadmap`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const roadmapEpic = res.body.epics.find((e) => e._id === epic._id);
    expect(roadmapEpic.totalChildren).toBe(0);
    expect(roadmapEpic.doneChildren).toBe(0);
  });
});
