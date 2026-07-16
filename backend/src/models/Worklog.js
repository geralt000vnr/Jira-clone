const mongoose = require('mongoose');

const worklogSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timeSpentSeconds: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worklog', worklogSchema);
