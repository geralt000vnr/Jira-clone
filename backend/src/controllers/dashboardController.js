const Issue = require('../models/Issue');
const IssueActivity = require('../models/IssueActivity');

// GET /api/dashboard/my-issues — everything assigned to the current user,
// across every project in their org. The frontend filters/groups by status
// category client-side, so no query params are needed here.
exports.getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find(req.scope({ assigneeId: req.user.id }))
      .populate('projectId', 'name key')
      .populate('statusId', 'name category color')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, issues });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/activity — recent activity across the whole org (not
// scoped to project membership, consistent with every other read endpoint
// in this app — only mutations are gated by project role).
exports.getRecentActivity = async (req, res, next) => {
  try {
    const activity = await IssueActivity.find({ organizationId: req.user.organizationId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('actorId', 'name avatarUrl')
      .populate({
        path: 'issueId',
        select: 'key title projectId',
        populate: { path: 'projectId', select: 'name key' },
      });
    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
};
