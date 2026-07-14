const IssueActivity = require('../models/IssueActivity');

exports.logActivity = async ({ organizationId, issueId, actorId, field, fromValue, toValue }) => {
  if (fromValue === toValue) return; // no-op change, skip noise
  await IssueActivity.create({ organizationId, issueId, actorId, field, fromValue, toValue });
};
