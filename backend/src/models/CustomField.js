const mongoose = require('mongoose');

const TYPES = ['text', 'number', 'date', 'checkbox', 'select'];

const customFieldSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TYPES, required: true },
    options: [{ type: String, trim: true }], // only meaningful when type === 'select'
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

customFieldSchema.index({ projectId: 1, order: 1 });

module.exports = mongoose.model('CustomField', customFieldSchema);
module.exports.TYPES = TYPES;
