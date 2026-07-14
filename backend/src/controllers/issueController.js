const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const IssueActivity = require('../models/IssueActivity');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../services/activityLogger');
const { notifyIssueUpdate } = require('../services/notificationService');

// POST /api/issues
exports.createIssue = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { projectId, title, description, type, priority, assigneeId, dueDate, labels, parentId } = req.body;

    // atomically bump the project's issue counter to generate a unique human-readable key
    const project = await Project.findOneAndUpdate(
      req.scope({ _id: projectId }),
      { $inc: { issueCounter: 1 } },
      { new: true, session }
    );
    if (!project) throw new ApiError(404, 'Project not found');

    const [issue] = await Issue.create(
      [
        {
          organizationId: req.user.organizationId,
          projectId,
          key: `${project.key}-${project.issueCounter}`,
          title,
          description,
          type: type || 'task',
          priority: priority || 'medium',
          assigneeId: assigneeId || null,
          reporterId: req.user.id,
          dueDate: dueDate || null,
          labels: labels || [],
          parentId: parentId || null,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    if (assigneeId) notifyIssueUpdate({ issue, event: 'assigned', actorId: req.user.id });

    res.status(201).json({ success: true, issue });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// GET /api/issues?projectId=&status=&priority=&assigneeId=&q=&sprintId=
exports.listIssues = async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId, q, sprintId } = req.query;
    const filter = req.scope({ projectId });
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (sprintId) filter.sprintId = sprintId;
    if (q) filter.$text = { $search: q };

    const issues = await Issue.find(filter).sort({ boardPosition: 1 });
    res.json({ success: true, issues });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:id  — includes subtasks for the detail modal
exports.getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne(req.scope({ _id: req.params.id }))
      .populate('assigneeId', 'name email avatarUrl')
      .populate('reporterId', 'name email avatarUrl');
    if (!issue) throw new ApiError(404, 'Issue not found');

    const subtasks = await Issue.find(req.scope({ parentId: issue._id }));

    res.json({ success: true, issue, subtasks });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/issues/:id  — general field edits (title, description, priority, assignee, due date, labels)
// Uses the same optimistic-locking pattern as moveIssue, since any field edit can race another edit.
exports.updateIssue = async (req, res, next) => {
  try {
    const { expectedVersion, ...fields } = req.body;
    const allowed = ['title', 'description', 'priority', 'assigneeId', 'dueDate', 'labels', 'sprintId'];
    const updates = {};
    for (const key of allowed) if (key in fields) updates[key] = fields[key];

    const before = await Issue.findOne(req.scope({ _id: req.params.id }));
    if (!before) throw new ApiError(404, 'Issue not found');

    const issue = await Issue.findOneAndUpdate(
      req.scope({ _id: req.params.id, version: expectedVersion }),
      { $set: updates, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!issue) throw new ApiError(409, 'Issue was modified by someone else. Please refresh and try again.');

    // log each changed field for the audit trail
    for (const key of Object.keys(updates)) {
      if (String(before[key]) !== String(updates[key])) {
        await logActivity({
          organizationId: req.user.organizationId,
          issueId: issue._id,
          actorId: req.user.id,
          field: key,
          fromValue: before[key],
          toValue: updates[key],
        });
      }
    }

    notifyIssueUpdate({ issue, event: 'updated', actorId: req.user.id });
    res.json({ success: true, issue });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/issues/:id/move
// Body: { toStatus, toPosition, expectedVersion, fromStatus }
// This is what fires when a card is dropped in a new board column.
exports.moveIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { toStatus, toPosition, expectedVersion, fromStatus } = req.body;

    // Optimistic locking: only succeeds if version still matches what the client last saw.
    const issue = await Issue.findOneAndUpdate(
      req.scope({ _id: id, version: expectedVersion }),
      {
        $set: { status: toStatus, boardPosition: toPosition },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!issue) {
      // Either not found, or someone else moved it first — client should refetch and retry.
      const current = await Issue.findOne(req.scope({ _id: id }));
      if (!current) throw new ApiError(404, 'Issue not found');
      throw new ApiError(409, 'Issue was modified by someone else. Please refresh and try again.');
    }

    await logActivity({
      organizationId: req.user.organizationId,
      issueId: issue._id,
      actorId: req.user.id,
      field: 'status',
      fromValue: fromStatus,
      toValue: toStatus,
    });

    notifyIssueUpdate({ issue, event: 'status_changed', actorId: req.user.id });

    res.json({ success: true, issue });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/issues/:id  (soft delete — also soft-deletes subtasks)
exports.deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      req.scope({ _id: req.params.id }),
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!issue) throw new ApiError(404, 'Issue not found');

    await Issue.updateMany(req.scope({ parentId: issue._id }), { $set: { deletedAt: new Date() } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:id/activity — audit trail for the issue detail modal
exports.getIssueActivity = async (req, res, next) => {
  try {
    const activity = await IssueActivity.find({
      issueId: req.params.id,
      organizationId: req.user.organizationId,
    })
      .sort({ createdAt: -1 })
      .populate('actorId', 'name avatarUrl');
    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
};
