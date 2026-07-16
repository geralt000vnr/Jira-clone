const Worklog = require('../models/Worklog');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const { notifyIssueUpdate } = require('../services/notificationService');
const { isProjectAdminForIssue } = require('../services/permissions');

// POST /api/issues/:id/worklogs — logs work and decrements the issue's remaining estimate
exports.createWorklog = async (req, res, next) => {
  try {
    const { timeSpentSeconds, description, startedAt } = req.body;

    const issue = await Issue.findOne(req.scope({ _id: req.params.id }));
    if (!issue) throw new ApiError(404, 'Issue not found');

    const worklog = await Worklog.create({
      organizationId: req.user.organizationId,
      issueId: issue._id,
      authorId: req.user.id,
      timeSpentSeconds,
      description,
      startedAt: startedAt || undefined,
    });

    issue.loggedSeconds += timeSpentSeconds;
    if (issue.remainingEstimateSeconds != null) {
      issue.remainingEstimateSeconds = Math.max(0, issue.remainingEstimateSeconds - timeSpentSeconds);
    }
    await issue.save();

    notifyIssueUpdate({ issue, event: 'worklog_added', actorId: req.user.id });

    const populated = await worklog.populate('authorId', 'name avatarUrl');
    res.status(201).json({ success: true, worklog: populated, issue });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:id/worklogs
exports.listWorklogs = async (req, res, next) => {
  try {
    const worklogs = await Worklog.find({
      issueId: req.params.id,
      organizationId: req.user.organizationId,
    })
      .sort({ startedAt: -1 })
      .populate('authorId', 'name avatarUrl');
    res.json({ success: true, worklogs });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/worklogs/:id — author, or a project admin, may delete; restores the time to the issue's remaining estimate
exports.deleteWorklog = async (req, res, next) => {
  try {
    const worklog = await Worklog.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!worklog) throw new ApiError(404, 'Worklog not found');

    const isAuthor = String(worklog.authorId) === String(req.user.id);
    if (!isAuthor) {
      const isAdmin = await isProjectAdminForIssue({
        issueId: worklog.issueId,
        organizationId: req.user.organizationId,
        userId: req.user.id,
      });
      if (!isAdmin) throw new ApiError(403, 'Only the author or a project admin can delete this worklog');
    }

    const issue = await Issue.findOne(req.scope({ _id: worklog.issueId }));
    if (issue) {
      issue.loggedSeconds = Math.max(0, issue.loggedSeconds - worklog.timeSpentSeconds);
      if (issue.remainingEstimateSeconds != null) {
        issue.remainingEstimateSeconds += worklog.timeSpentSeconds;
      }
      await issue.save();
    }

    await worklog.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
