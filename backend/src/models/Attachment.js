const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true }, // path/key used by the storage backend
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
