// One-time migration for databases created before per-project custom workflow statuses existed.
// Old schema: Issue.status was one of the fixed strings 'todo' | 'in_progress' | 'done'.
// New schema: Issue.statusId references a WorkflowStatus document.
//
// For each project, creates the same 3 default statuses createProject now seeds automatically,
// then repoints every issue's old `status` string at the matching new WorkflowStatus._id.
//
// Usage: node scripts/migrate-workflow-statuses.js
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');
const Project = require('../src/models/Project');
const WorkflowStatus = require('../src/models/WorkflowStatus');

const DEFAULT_STATUSES = [
  { name: 'To Do', category: 'todo', color: 'slate', order: 0 },
  { name: 'In Progress', category: 'in_progress', color: 'blue', order: 1 },
  { name: 'Done', category: 'done', color: 'emerald', order: 2 },
];

async function run() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const projects = await Project.find({});
  let migratedIssues = 0;

  for (const project of projects) {
    const existing = await WorkflowStatus.findOne({ projectId: project._id });
    if (existing) continue; // already migrated (or created post-migration)

    const created = await WorkflowStatus.insertMany(
      DEFAULT_STATUSES.map((s) => ({ ...s, organizationId: project.organizationId, projectId: project._id }))
    );
    const idByCategory = Object.fromEntries(created.map((s) => [s.category, s._id]));
    const idByOldStatusName = { todo: idByCategory.todo, in_progress: idByCategory.in_progress, done: idByCategory.done };

    // bypass the Issue model (which no longer has a `status` field) and update the raw collection
    for (const [oldStatus, statusId] of Object.entries(idByOldStatusName)) {
      const result = await db
        .collection('issues')
        .updateMany({ projectId: project._id, status: oldStatus }, { $set: { statusId }, $unset: { status: '' } });
      migratedIssues += result.modifiedCount;
    }
  }

  console.log(`Migrated ${projects.length} project(s), ${migratedIssues} issue(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
