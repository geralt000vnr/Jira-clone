const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

// Signup always creates a brand-new org, so there's no API path to get a second user
// into an *existing* org for tests. Reassign directly and re-login to get a token
// scoped to the target org — the same trick used to verify this by hand during
// Phase 1 (see PROGRESS.md), formalized here for reuse in tests.
async function moveUserToOrg(email, organizationId) {
  await User.updateOne({ email }, { $set: { organizationId } });
}

// Shared monotonic counter for unique emails/org names/project keys — calls can happen
// fast enough (multiple per millisecond) that Date.now() alone isn't a safe uniqueness
// source, and every signup()/createProject() call needs a value that's unique even when
// the caller doesn't explicitly override it (Organization.slug and the project key are
// both unique-indexed).
let counter = 0;
function next() {
  counter += 1;
  return counter;
}

function uniqueEmail(prefix = 'user') {
  return `${prefix}${next()}@example.test`;
}

async function signup(overrides = {}) {
  const email = overrides.email || uniqueEmail();
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      orgName: overrides.orgName || `Test Org ${next()}`,
      name: overrides.name || 'Test User',
      email,
      password: overrides.password || 'password123',
    });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, user: res.body.user, email };
}

async function createProject(token, overrides = {}) {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name || 'Test Project',
      key: overrides.key || `TP${next()}`.slice(0, 10),
      description: overrides.description || '',
    });
  if (res.status !== 201) throw new Error(`createProject failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.project;
}

async function getWorkflowStatuses(token, projectId) {
  const res = await request(app).get(`/api/projects/${projectId}/workflow-statuses`).set('Authorization', `Bearer ${token}`);
  return res.body.statuses;
}

// Convenience: signup + create project + fetch the seeded default statuses in one call.
async function setupProject(overrides = {}) {
  const { token, user } = await signup(overrides);
  const project = await createProject(token, overrides);
  const statuses = await getWorkflowStatuses(token, project._id);
  return { token, user, project, statuses };
}

module.exports = { app, request, signup, createProject, getWorkflowStatuses, setupProject, uniqueEmail, moveUserToOrg };
