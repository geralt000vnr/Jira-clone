const mongoose = require('mongoose');

const LINK_TYPES = ['blocks', 'relates_to', 'duplicates'];

// Inverse phrasing shown when viewing the link from the target issue's side.
const INVERSE_LABEL = {
  blocks: 'is blocked by',
  relates_to: 'relates to',
  duplicates: 'is duplicated by',
};

const FORWARD_LABEL = {
  blocks: 'blocks',
  relates_to: 'relates to',
  duplicates: 'duplicates',
};

const issueLinkSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    sourceIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    targetIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    type: { type: String, enum: LINK_TYPES, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssueLink', issueLinkSchema);
module.exports.LINK_TYPES = LINK_TYPES;
module.exports.INVERSE_LABEL = INVERSE_LABEL;
module.exports.FORWARD_LABEL = FORWARD_LABEL;
