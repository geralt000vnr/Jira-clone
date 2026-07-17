const { app, request, setupProject } = require('./helpers');

describe('custom fields', () => {
  it('creates a custom field and appends it after existing ones', async () => {
    const { token, project } = await setupProject();

    const first = await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Component', type: 'select', options: ['API', 'UI'] });
    expect(first.status).toBe(201);
    expect(first.body.field.order).toBe(0);

    const second = await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Severity', type: 'text' });
    expect(second.status).toBe(201);
    expect(second.body.field.order).toBe(1);
  });

  it('lists fields sorted by order', async () => {
    const { token, project } = await setupProject();
    await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', type: 'text' });
    await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'B', type: 'text' });

    const res = await request(app)
      .get(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.fields.map((f) => f.name)).toEqual(['A', 'B']);
  });

  it('updates a field, including reordering', async () => {
    const { token, project } = await setupProject();
    const create = await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Component', type: 'text' });

    const res = await request(app)
      .patch(`/api/projects/${project._id}/custom-fields/${create.body.field._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', order: 5 });

    expect(res.status).toBe(200);
    expect(res.body.field.name).toBe('Renamed');
    expect(res.body.field.order).toBe(5);
  });

  it('deletes a field even if issues still have values for it (no in-use guard)', async () => {
    const { token, project } = await setupProject();
    const create = await request(app)
      .post(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Component', type: 'text' });
    const fieldId = create.body.field._id;

    const issue = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: project._id, title: 'Uses the field' });
    const updateRes = await request(app)
      .patch(`/api/issues/${issue.body.issue._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ customFieldValues: { [fieldId]: 'some value' }, expectedVersion: 0 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.issue.customFieldValues).toEqual({ [fieldId]: 'some value' });

    const deleteRes = await request(app)
      .delete(`/api/projects/${project._id}/custom-fields/${fieldId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get(`/api/projects/${project._id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.fields).toHaveLength(0);
  });
});
