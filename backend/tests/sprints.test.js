const { app, request, setupProject } = require('./helpers');

async function createSprint(token, projectId, overrides = {}) {
  const now = Date.now();
  const res = await request(app)
    .post('/api/sprints')
    .set('Authorization', `Bearer ${token}`)
    .send({
      projectId,
      name: overrides.name || 'Sprint 1',
      startDate: overrides.startDate || new Date(now).toISOString(),
      endDate: overrides.endDate || new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  if (res.status !== 201) throw new Error(`createSprint failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.sprint;
}

describe('sprints', () => {
  it('only allows one active sprint per project', async () => {
    const { token, project } = await setupProject();
    const sprintA = await createSprint(token, project._id, { name: 'A' });
    const sprintB = await createSprint(token, project._id, { name: 'B' });

    const startA = await request(app).post(`/api/sprints/${sprintA._id}/start`).set('Authorization', `Bearer ${token}`);
    expect(startA.status).toBe(200);

    const startB = await request(app).post(`/api/sprints/${sprintB._id}/start`).set('Authorization', `Bearer ${token}`);
    expect(startB.status).toBe(409);
  });

  it('completing a sprint returns unfinished issues to the backlog but keeps done ones assigned', async () => {
    const { token, project, statuses } = await setupProject();
    const sprint = await createSprint(token, project._id);
    await request(app).post(`/api/sprints/${sprint._id}/start`).set('Authorization', `Bearer ${token}`);

    const doneStatus = statuses.find((s) => s.category === 'done');
    const unfinished = (
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId: project._id, title: 'Not done' })
    ).body.issue;
    const finished = (
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId: project._id, title: 'Done' })
    ).body.issue;

    await request(app).post(`/api/sprints/${sprint._id}/issues`).set('Authorization', `Bearer ${token}`).send({ issueId: unfinished._id });
    await request(app).post(`/api/sprints/${sprint._id}/issues`).set('Authorization', `Bearer ${token}`).send({ issueId: finished._id });
    await request(app)
      .patch(`/api/issues/${finished._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, expectedVersion: 1 }); // v1: already bumped by addIssueToSprint

    const completeRes = await request(app).post(`/api/sprints/${sprint._id}/complete`).set('Authorization', `Bearer ${token}`);
    expect(completeRes.status).toBe(200);

    const unfinishedAfter = await request(app).get(`/api/issues/${unfinished._id}`).set('Authorization', `Bearer ${token}`);
    expect(unfinishedAfter.body.issue.sprintId).toBeNull();

    const finishedAfter = await request(app).get(`/api/issues/${finished._id}`).set('Authorization', `Bearer ${token}`);
    expect(finishedAfter.body.issue.sprintId).toBe(sprint._id);
  });

  it('burndown reflects total story points and an actual line that only counts completed points', async () => {
    const { token, project, statuses } = await setupProject();
    const sprint = await createSprint(token, project._id);
    const doneStatus = statuses.find((s) => s.category === 'done');

    const issue = (
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId: project._id, title: 'Pointed', storyPoints: 5 })
    ).body.issue;
    await request(app).post(`/api/sprints/${sprint._id}/issues`).set('Authorization', `Bearer ${token}`).send({ issueId: issue._id });
    await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, expectedVersion: 1 });

    const burndownRes = await request(app).get(`/api/sprints/${sprint._id}/burndown`).set('Authorization', `Bearer ${token}`);
    expect(burndownRes.status).toBe(200);
    expect(burndownRes.body.totalPoints).toBe(5);
    // the sprint just started "today" in this test, so day 1's actual should already reflect the completion
    expect(burndownRes.body.data[0].actual).toBe(0);
  });
});
