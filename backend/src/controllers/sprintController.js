const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');

// POST /api/sprints
exports.createSprint = async (req, res, next) => {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body;
    const sprint = await Sprint.create({
      organizationId: req.user.organizationId,
      projectId,
      name,
      goal,
      startDate,
      endDate,
    });
    res.status(201).json({ success: true, sprint });
  } catch (err) {
    next(err);
  }
};

// GET /api/sprints?projectId=
exports.listSprints = async (req, res, next) => {
  try {
    const sprints = await Sprint.find({
      projectId: req.query.projectId,
      organizationId: req.user.organizationId,
    }).sort({ startDate: -1 });
    res.json({ success: true, sprints });
  } catch (err) {
    next(err);
  }
};

// GET /api/sprints/:id  — includes its issues, for the sprint board / burndown view
exports.getSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!sprint) throw new ApiError(404, 'Sprint not found');

    const issues = await Issue.find(req.scope({ sprintId: sprint._id }));
    res.json({ success: true, sprint, issues });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/sprints/:id  — edit name/goal/dates while still 'planned'
exports.updateSprint = async (req, res, next) => {
  try {
    const { name, goal, startDate, endDate } = req.body;
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId, status: 'planned' },
      { $set: { name, goal, startDate, endDate } },
      { new: true }
    );
    if (!sprint) throw new ApiError(409, 'Only planned sprints can be edited (has it already started?)');
    res.json({ success: true, sprint });
  } catch (err) {
    next(err);
  }
};

// POST /api/sprints/:id/start  — enforces only one active sprint per project
exports.startSprint = async (req, res, next) => {
  try {
    const sprint = req.sprint || (await Sprint.findOne({ _id: req.params.id, organizationId: req.user.organizationId }));
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    if (sprint.status !== 'planned') throw new ApiError(409, 'Only a planned sprint can be started');

    const existingActive = await Sprint.findOne({ projectId: sprint.projectId, status: 'active' });
    if (existingActive) throw new ApiError(409, `Sprint "${existingActive.name}" is already active. Complete it first.`);

    sprint.status = 'active';
    await sprint.save();
    res.json({ success: true, sprint });
  } catch (err) {
    next(err);
  }
};

// POST /api/sprints/:id/complete  — moves any unfinished issues back to the backlog (sprintId = null)
exports.completeSprint = async (req, res, next) => {
  try {
    const sprint = req.sprint || (await Sprint.findOne({ _id: req.params.id, organizationId: req.user.organizationId }));
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    if (sprint.status !== 'active') throw new ApiError(409, 'Only an active sprint can be completed');

    await Issue.updateMany(
      req.scope({ sprintId: sprint._id, status: { $ne: 'done' } }),
      { $set: { sprintId: null }, $inc: { version: 1 } }
    );

    sprint.status = 'completed';
    await sprint.save();
    res.json({ success: true, sprint });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sprints/:id  — only allowed before it starts; unassigns any issues first
exports.deleteSprint = async (req, res, next) => {
  try {
    const sprint = req.sprint || (await Sprint.findOne({ _id: req.params.id, organizationId: req.user.organizationId }));
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    if (sprint.status !== 'planned') throw new ApiError(409, 'Only a planned sprint can be deleted');

    await Issue.updateMany(req.scope({ sprintId: sprint._id }), { $set: { sprintId: null } });
    await sprint.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/sprints/:id/issues  — add an issue to this sprint (drag from backlog)
exports.addIssueToSprint = async (req, res, next) => {
  try {
    const { issueId } = req.body;
    const issue = await Issue.findOneAndUpdate(
      req.scope({ _id: issueId }),
      { $set: { sprintId: req.params.id }, $inc: { version: 1 } },
      { new: true }
    );
    if (!issue) throw new ApiError(404, 'Issue not found');
    res.json({ success: true, issue });
  } catch (err) {
    next(err);
  }
};
