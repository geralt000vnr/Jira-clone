const mongoose = require('mongoose');

const issueActivitySchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    field: { type: String, required: true }, // 'status' | 'assigneeId' | 'priority' | ...
    fromValue: { type: mongoose.Schema.Types.Mixed },
    toValue: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssueActivity', issueActivitySchema);
