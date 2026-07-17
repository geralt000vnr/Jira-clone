const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const WorkflowStatus = require('../models/WorkflowStatus');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');

const DEFAULT_STATUSES = [
  { name: 'To Do', category: 'todo', color: 'slate', order: 0 },
  { name: 'In Progress', category: 'in_progress', color: 'blue', order: 1 },
  { name: 'Done', category: 'done', color: 'emerald', order: 2 },
];

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, key, description } = req.body;

    const project = await Project.create({
      organizationId: req.user.organizationId,
      name,
      key: key.toUpperCase(),
      description,
      createdBy: req.user.id,
    });

    // creator becomes admin on the project automatically
    await ProjectMember.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      role: 'admin',
    });

    // every project starts with a default 3-column workflow (customizable afterward)
    await WorkflowStatus.insertMany(
      DEFAULT_STATUSES.map((s) => ({ ...s, organizationId: req.user.organizationId, projectId: project._id }))
    );

    res.status(201).json({ success: true, project });
  } catch (err) {
    if (err.code === 11000) return next(new ApiError(409, 'A project with that key already exists'));
    next(err);
  }
};

// GET /api/projects  — list projects the current user belongs to
exports.listProjects = async (req, res, next) => {
  try {
    const memberships = await ProjectMember.find({ userId: req.user.id, organizationId: req.user.organizationId });
    const projectIds = memberships.map((m) => m.projectId);
    const projects = await Project.find(req.scope({ _id: { $in: projectIds } }));
    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne(req.scope({ _id: req.params.projectId }));
    if (!project) throw new ApiError(404, 'Project not found');
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId  (admin only — see route middleware)
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findOneAndUpdate(
      req.scope({ _id: req.params.projectId }),
      { $set: { name, description } },
      { new: true, runValidators: true }
    );
    if (!project) throw new ApiError(404, 'Project not found');
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId  (admin only — soft delete)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      req.scope({ _id: req.params.projectId }),
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!project) throw new ApiError(404, 'Project not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/members
exports.listMembers = async (req, res, next) => {
  try {
    const members = await ProjectMember.find({
      projectId: req.params.projectId,
      organizationId: req.user.organizationId,
    }).populate('userId', 'name email avatarUrl');
    res.json({ success: true, members });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members  (admin/manager only — see route middleware)
exports.addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    const membership = await ProjectMember.findOneAndUpdate(
      { projectId, userId, organizationId: req.user.organizationId },
      { $set: { role } },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, membership });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    await ProjectMember.deleteOne({ projectId, userId, organizationId: req.user.organizationId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/roadmap
// Returns every Epic in the project with its date range and a done/total
// child-issue count, derived from an aggregate over child Issues + their
// WorkflowStatus category (no separate progress-tracking field to maintain).
exports.getRoadmap = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const epics = await Issue.find(req.scope({ projectId, type: 'epic' })).select('key title startDate dueDate');
    const epicIds = epics.map((e) => e._id);

    const counts = await Issue.aggregate([
      {
        $match: {
          ...req.scope({ projectId: new mongoose.Types.ObjectId(projectId), parentId: { $in: epicIds } }),
          organizationId: new mongoose.Types.ObjectId(req.user.organizationId),
        },
      },
      {
        $lookup: {
          from: 'workflowstatuses',
          localField: 'statusId',
          foreignField: '_id',
          as: 'status',
        },
      },
      { $unwind: '$status' },
      { $group: { _id: { parentId: '$parentId', category: '$status.category' }, count: { $sum: 1 } } },
    ]);

    const progressByEpic = {};
    for (const c of counts) {
      const pid = String(c._id.parentId);
      progressByEpic[pid] = progressByEpic[pid] || { total: 0, done: 0 };
      progressByEpic[pid].total += c.count;
      if (c._id.category === 'done') progressByEpic[pid].done += c.count;
    }

    const result = epics.map((e) => ({
      _id: e._id,
      key: e.key,
      title: e.title,
      startDate: e.startDate,
      dueDate: e.dueDate,
      totalChildren: progressByEpic[String(e._id)]?.total || 0,
      doneChildren: progressByEpic[String(e._id)]?.done || 0,
    }));

    res.json({ success: true, epics: result });
  } catch (err) {
    next(err);
  }
};
