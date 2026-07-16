const mongoose = require('mongoose');

const ISSUE_TYPES = ['epic', 'story', 'task', 'bug', 'subtask'];
const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];

const issueSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null, index: true },

    key: { type: String, required: true }, // e.g. ENG-123, generated from project.issueCounter
    type: { type: String, enum: ISSUE_TYPES, required: true, default: 'task' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowStatus', required: true, index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },

    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    labels: [{ type: String, trim: true }],
    dueDate: { type: Date, default: null },

    // board column ordering
    boardPosition: { type: Number, default: 0 },

    // estimation / time tracking
    storyPoints: { type: Number, default: null, min: 0 },
    originalEstimateSeconds: { type: Number, default: null, min: 0 },
    remainingEstimateSeconds: { type: Number, default: null, min: 0 },
    loggedSeconds: { type: Number, default: 0, min: 0 },

    // optimistic locking for concurrent drag-and-drop / edits
    version: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

issueSchema.index({ title: 'text', description: 'text' });
issueSchema.index({ projectId: 1, statusId: 1 });

// Prevent subtasks from having children of their own
issueSchema.pre('save', async function (next) {
  if (this.type === 'subtask' && this.isModified('parentId') && this.parentId) {
    const Issue = mongoose.model('Issue');
    const parent = await Issue.findById(this.parentId).select('type');
    if (parent && parent.type === 'subtask') {
      return next(new Error('A subtask cannot be nested under another subtask'));
    }
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
module.exports.ISSUE_TYPES = ISSUE_TYPES;
module.exports.PRIORITIES = PRIORITIES;
