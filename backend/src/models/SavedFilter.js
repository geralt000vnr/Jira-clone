const mongoose = require('mongoose');

const savedFilterSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    filters: {
      statusId: { type: String, default: '' },
      priority: { type: String, default: '' },
      assigneeId: { type: String, default: '' },
      q: { type: String, default: '' },
    },
    isShared: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedFilter', savedFilterSchema);
