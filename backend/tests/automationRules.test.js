const mongoose = require('mongoose');
const { app, request, setupProject } = require('./helpers');

async function createIssue(token, projectId, overrides = {}) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${token}`)
    .send({ projectId, title: overrides.title || 'An issue', ...overrides });
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.issue;
}

async function createRule(token, projectId, overrides = {}) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/automation-rules`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: overrides.name || 'A rule', trigger: 'issue_created', actionType: 'add_comment', ...overrides });
  if (res.status !== 201) throw new Error(`createRule failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.rule;
}

describe('automation rules', () => {
  it('creates rules and lists them sorted by order', async () => {
    const { token, project } = await setupProject();
    const first = await createRule(token, project._id, { name: 'First' });
    const second = await createRule(token, project._id, { name: 'Second' });
    expect(first.order).toBe(0);
    expect(second.order).toBe(1);

    const res = await request(app)
      .get(`/api/projects/${project._id}/automation-rules`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rules.map((r) => r.name)).toEqual(['First', 'Second']);
  });

  it('updates (including toggling enabled) and deletes a rule', async () => {
    const { token, project } = await setupProject();
    const rule = await createRule(token, project._id);

    const updateRes = await request(app)
      .patch(`/api/projects/${project._id}/automation-rules/${rule._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: false, name: 'Renamed' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.rule.enabled).toBe(false);
    expect(updateRes.body.rule.name).toBe('Renamed');

    const deleteRes = await request(app)
      .delete(`/api/projects/${project._id}/automation-rules/${rule._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get(`/api/projects/${project._id}/automation-rules`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.rules).toHaveLength(0);
  });

  it('fires an issue_created -> add_comment rule when an issue is created', async () => {
    const { token, project } = await setupProject();
    await createRule(token, project._id, {
      trigger: 'issue_created',
      actionType: 'add_comment',
      actionValue: 'Welcome! Auto-triaging this issue.',
    });

    const issue = await createIssue(token, project._id);

    const commentsRes = await request(app)
      .get(`/api/issues/${issue._id}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(commentsRes.body.comments).toHaveLength(1);
    expect(commentsRes.body.comments[0].body).toBe('Welcome! Auto-triaging this issue.');
  });

  it('fires an issue_status_changed rule only when the condition matches, applying set_priority', async () => {
    const { token, project, statuses } = await setupProject();
    const doneStatus = statuses.find((s) => s.category === 'done');
    const todoStatus = statuses.find((s) => s.category === 'todo');

    await createRule(token, project._id, {
      trigger: 'issue_status_changed',
      conditionField: 'statusId',
      conditionValue: doneStatus._id,
      actionType: 'set_priority',
      actionValue: 'highest',
    });

    const issue = await createIssue(token, project._id, { priority: 'low' });

    const moveRes = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: doneStatus._id, toPosition: 0, fromStatusId: todoStatus._id, expectedVersion: 0 });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.issue.priority).toBe('highest');
  });

  it('does not fire when the condition does not match', async () => {
    const { token, project, statuses } = await setupProject();
    const doneStatus = statuses.find((s) => s.category === 'done');
    const inProgressStatus = statuses.find((s) => s.category === 'in_progress');
    const todoStatus = statuses.find((s) => s.category === 'todo');

    await createRule(token, project._id, {
      trigger: 'issue_status_changed',
      conditionField: 'statusId',
      conditionValue: doneStatus._id,
      actionType: 'set_priority',
      actionValue: 'highest',
    });

    const issue = await createIssue(token, project._id, { priority: 'low' });

    const moveRes = await request(app)
      .patch(`/api/issues/${issue._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toStatusId: inProgressStatus._id, toPosition: 0, fromStatusId: todoStatus._id, expectedVersion: 0 });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.issue.priority).toBe('low');
  });

  it('does not fire when the rule is disabled', async () => {
    const { token, project } = await setupProject();
    await createRule(token, project._id, {
      trigger: 'issue_created',
      actionType: 'add_comment',
      actionValue: 'Should not appear',
      enabled: false,
    });

    const issue = await createIssue(token, project._id);

    const commentsRes = await request(app)
      .get(`/api/issues/${issue._id}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(commentsRes.body.comments).toHaveLength(0);
  });

  it('issue_assigned -> assign_to_reporter overrides the user\'s own assignment in the same response', async () => {
    const { token, project, user } = await setupProject();
    await createRule(token, project._id, {
      trigger: 'issue_assigned',
      actionType: 'assign_to_reporter',
    });

    const issue = await createIssue(token, project._id); // reporterId === user.id
    const otherUserId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/api/issues/${issue._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: otherUserId, expectedVersion: issue.version });

    expect(res.status).toBe(200);
    expect(res.body.issue.assigneeId).toBe(user.id);
  });
});
