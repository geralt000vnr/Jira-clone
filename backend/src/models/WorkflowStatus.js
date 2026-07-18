const mongoose = require('mongoose');

const CATEGORIES = ['todo', 'in_progress', 'done'];
const COLORS = ['slate', 'blue', 'emerald', 'amber', 'violet', 'rose'];

const workflowStatusSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    order: { type: Number, default: 0 },
    color: { type: String, enum: COLORS, default: 'slate' },
    // Statuses this one may move to. Empty = unrestricted (any status allowed) —
    // preserves existing behavior until an admin opts into restricting transitions.
    allowedTransitions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowStatus' }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

workflowStatusSchema.index({ projectId: 1, order: 1 });

module.exports = mongoose.model('WorkflowStatus', workflowStatusSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.COLORS = COLORS;
