const Issue = require('../models/Issue');
const ProjectMember = require('../models/ProjectMember');

// Comment/attachment/worklog deletion routes are keyed by their own id (not nested under
// a project), so there's no :projectId in the URL for requireProjectRole to read. This
// resolves "is this user an admin on the project that owns this issue?" on demand instead.
exports.isProjectAdminForIssue = async ({ issueId, organizationId, userId }) => {
  const issue = await Issue.findOne({ _id: issueId, organizationId }).select('projectId');
  if (!issue) return false;

  const membership = await ProjectMember.findOne({ projectId: issue.projectId, userId, organizationId });
  return membership?.role === 'admin';
};
