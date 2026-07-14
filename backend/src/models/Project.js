const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true, uppercase: true, trim: true }, // e.g. "ENG" -> ENG-123
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueCounter: { type: Number, default: 0 }, // used to generate ENG-1, ENG-2 ...
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

projectSchema.index({ organizationId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
