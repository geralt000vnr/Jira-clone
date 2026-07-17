const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const IssueActivity = require('../models/IssueActivity');
const WorkflowStatus = require('../models/WorkflowStatus');
const IssueLink = require('../models/IssueLink');
const { FORWARD_LABEL, INVERSE_LABEL } = require('../models/IssueLink');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../services/activityLogger');
const { notifyIssueUpdate } = require('../services/notificationService');
const { runAutomations } = require('../services/automationEngine');

// POST /api/issues
exports.createIssue = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { projectId, title, description, type, priority, assigneeId, dueDate, labels, parentId, storyPoints } =
      req.body;

    // atomically bump the project's issue counter to generate a unique human-readable key
    const project = await Project.findOneAndUpdate(
      req.scope({ _id: projectId }),
      { $inc: { issueCounter: 1 } },
      { new: true, session }
    );
    if (!project) throw new ApiError(404, 'Project not found');

    // new issues start in the project's first 'todo'-category status
    const defaultStatus = await WorkflowStatus.findOne({ projectId, category: 'todo', deletedAt: null })
      .sort({ order: 1 })
      .session(session);
    if (!defaultStatus) throw new ApiError(500, "Project has no 'todo' workflow status configured");

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
          statusId: defaultStatus._id,
          assigneeId: assigneeId || null,
          reporterId: req.user.id,
          dueDate: dueDate || null,
          labels: labels || [],
          parentId: parentId || null,
          storyPoints: storyPoints ?? null,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    if (assigneeId) notifyIssueUpdate({ issue, event: 'assigned', actorId: req.user.id });

    const finalIssue = await runAutomations({
      trigger: 'issue_created',
      issue,
      organizationId: req.user.organizationId,
      projectId,
      actorId: req.user.id,
    });

    res.status(201).json({ success: true, issue: finalIssue });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// GET /api/issues?projectId=&statusId=&priority=&assigneeId=&q=&sprintId=&page=&limit=
// page/limit are optional (default page 1, limit 200) so existing callers that only care
// about `issues` keep working unchanged for any project under the default limit.
exports.listIssues = async (req, res, next) => {
  try {
    const { projectId, statusId, priority, assigneeId, q, sprintId, page, limit } = req.query;
    const filter = req.scope({ projectId });
    if (statusId) filter.statusId = statusId;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (sprintId) filter.sprintId = sprintId;
    if (q) filter.$text = { $search: q };

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort({ boardPosition: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Issue.countDocuments(filter),
    ]);

    res.json({ success: true, issues, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:id  — includes subtasks and linked issues for the detail modal
exports.getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne(req.scope({ _id: req.params.id }))
      .populate('assigneeId', 'name email avatarUrl')
      .populate('reporterId', 'name email avatarUrl');
    if (!issue) throw new ApiError(404, 'Issue not found');

    const subtasks = await Issue.find(req.scope({ parentId: issue._id }));

    const linkRows = await IssueLink.find({
      organizationId: req.user.organizationId,
      $or: [{ sourceIssueId: issue._id }, { targetIssueId: issue._id }],
    })
      .populate('sourceIssueId', 'key title statusId')
      .populate('targetIssueId', 'key title statusId');

    // resolve the display label + "other issue" from this issue's point of view,
    // since a link is stored once but reads differently from each side (e.g. "blocks" / "is blocked by")
    const links = linkRows.map((link) => {
      const isSource = String(link.sourceIssueId._id) === String(issue._id);
      return {
        _id: link._id,
        label: isSource ? FORWARD_LABEL[link.type] : INVERSE_LABEL[link.type],
        issue: isSource ? link.targetIssueId : link.sourceIssueId,
      };
    });

    res.json({ success: true, issue, subtasks, links });
  } catch (err) {
    next(err);
  }
};

// POST /api/issues/:id/links
exports.createIssueLink = async (req, res, next) => {
  try {
    const { targetIssueId, type } = req.body;
    if (targetIssueId === req.params.id) throw new ApiError(400, 'An issue cannot be linked to itself');

    const [source, target] = await Promise.all([
      Issue.findOne(req.scope({ _id: req.params.id })),
      Issue.findOne(req.scope({ _id: targetIssueId })),
    ]);
    if (!source || !target) throw new ApiError(404, 'Issue not found');

    const link = await IssueLink.create({
      organizationId: req.user.organizationId,
      sourceIssueId: source._id,
      targetIssueId: target._id,
      type,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      link: { _id: link._id, label: FORWARD_LABEL[type], issue: { _id: target._id, key: target.key, title: target.title, statusId: target.statusId } },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/issues/:id/links/:linkId
exports.deleteIssueLink = async (req, res, next) => {
  try {
    const link = await IssueLink.findOneAndDelete({
      _id: req.params.linkId,
      organizationId: req.user.organizationId,
      $or: [{ sourceIssueId: req.params.id }, { targetIssueId: req.params.id }],
    });
    if (!link) throw new ApiError(404, 'Link not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/issues/:id  — general field edits (title, description, priority, assignee, due date, labels, estimates)
// Uses the same optimistic-locking pattern as moveIssue, since any field edit can race another edit.
exports.updateIssue = async (req, res, next) => {
  try {
    const { expectedVersion, ...fields } = req.body;
    const allowed = [
      'title',
      'description',
      'priority',
      'assigneeId',
      'dueDate',
      'startDate',
      'labels',
      'sprintId',
      'storyPoints',
      'originalEstimateSeconds',
      'customFieldValues',
    ];
    const updates = {};
    for (const key of allowed) if (key in fields) updates[key] = fields[key];

    const before = await Issue.findOne(req.scope({ _id: req.params.id }));
    if (!before) throw new ApiError(404, 'Issue not found');

    // setting originalEstimateSeconds for the first time also seeds remainingEstimateSeconds,
    // matching Jira's behavior — remaining only tracks independently once work has been logged
    if ('originalEstimateSeconds' in updates && before.loggedSeconds === 0) {
      updates.remainingEstimateSeconds = updates.originalEstimateSeconds;
    }

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

    let finalIssue = issue;
    if ('assigneeId' in updates && String(before.assigneeId) !== String(updates.assigneeId)) {
      finalIssue = await runAutomations({
        trigger: 'issue_assigned',
        issue,
        organizationId: req.user.organizationId,
        projectId: issue.projectId,
        actorId: req.user.id,
      });
    }

    res.json({ success: true, issue: finalIssue });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/issues/:id/move
// Body: { toStatusId, toPosition, expectedVersion, fromStatusId }
// This is what fires when a card is dropped in a new board column.
exports.moveIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { toStatusId, toPosition, expectedVersion, fromStatusId } = req.body;

    // Optimistic locking: only succeeds if version still matches what the client last saw.
    const issue = await Issue.findOneAndUpdate(
      req.scope({ _id: id, version: expectedVersion }),
      {
        $set: { statusId: toStatusId, boardPosition: toPosition },
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

    // resolve status names for a human-readable audit trail entry
    const [fromStatus, toStatus] = await Promise.all([
      fromStatusId ? WorkflowStatus.findById(fromStatusId).select('name') : null,
      WorkflowStatus.findById(toStatusId).select('name'),
    ]);

    await logActivity({
      organizationId: req.user.organizationId,
      issueId: issue._id,
      actorId: req.user.id,
      field: 'status',
      fromValue: fromStatus?.name || fromStatusId,
      toValue: toStatus?.name || toStatusId,
    });

    notifyIssueUpdate({ issue, event: 'status_changed', actorId: req.user.id });

    const finalIssue = await runAutomations({
      trigger: 'issue_status_changed',
      issue,
      organizationId: req.user.organizationId,
      projectId: issue.projectId,
      actorId: req.user.id,
    });

    res.json({ success: true, issue: finalIssue });
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

// PATCH /api/issues/bulk — applies the same field updates to many issues at once.
// Each item still goes through the normal optimistic-locking check individually, so a
// bulk operation can partially succeed; the response reports which issues actually changed.
exports.bulkUpdateIssues = async (req, res, next) => {
  try {
    const { items, updates } = req.body;

    let statusName = null;
    if (updates.statusId) {
      const status = await WorkflowStatus.findOne(req.scope({ _id: updates.statusId }));
      if (!status) throw new ApiError(404, 'Workflow status not found');
      statusName = status.name;
    }

    const succeeded = [];
    const failed = [];

    for (const { issueId, expectedVersion } of items) {
      const before = await Issue.findOne(req.scope({ _id: issueId }));
      if (!before) {
        failed.push({ issueId, reason: 'not_found' });
        continue;
      }

      const issue = await Issue.findOneAndUpdate(
        req.scope({ _id: issueId, version: expectedVersion }),
        { $set: updates, $inc: { version: 1 } },
        { new: true, runValidators: true }
      );

      if (!issue) {
        failed.push({ issueId, reason: 'version_conflict' });
        continue;
      }

      // status is logged separately below with resolved names, not raw WorkflowStatus ids
      for (const key of Object.keys(updates).filter((k) => k !== 'statusId')) {
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
      if (updates.statusId && String(before.statusId) !== String(updates.statusId)) {
        const fromStatus = await WorkflowStatus.findById(before.statusId).select('name');
        await logActivity({
          organizationId: req.user.organizationId,
          issueId: issue._id,
          actorId: req.user.id,
          field: 'status',
          fromValue: fromStatus?.name || before.statusId,
          toValue: statusName,
        });
      }

      notifyIssueUpdate({ issue, event: 'updated', actorId: req.user.id });
      succeeded.push(issue._id);
    }

    res.json({ success: true, succeeded, failed });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/issues/bulk — soft-deletes many issues (and their subtasks) at once
exports.bulkDeleteIssues = async (req, res, next) => {
  try {
    const { issueIds } = req.body;

    const issues = await Issue.find(req.scope({ _id: { $in: issueIds } }));
    const foundIds = issues.map((i) => i._id);

    await Issue.updateMany({ _id: { $in: foundIds } }, { $set: { deletedAt: new Date() } });
    await Issue.updateMany(req.scope({ parentId: { $in: foundIds } }), { $set: { deletedAt: new Date() } });

    const failed = issueIds.filter((id) => !foundIds.some((f) => String(f) === id)).map((issueId) => ({
      issueId,
      reason: 'not_found',
    }));

    res.json({ success: true, succeeded: foundIds, failed });
  } catch (err) {
    next(err);
  }
};
