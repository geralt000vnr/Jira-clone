const mongoose = require('mongoose');

const ROLES = ['admin', 'manager', 'developer', 'tester'];

const projectMemberSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true }
);

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
module.exports.ROLES = ROLES;
