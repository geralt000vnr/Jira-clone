const WorkflowStatus = require('../models/WorkflowStatus');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');

// GET /api/projects/:projectId/workflow-statuses
exports.listWorkflowStatuses = async (req, res, next) => {
  try {
    const statuses = await WorkflowStatus.find(
      req.scope({ projectId: req.params.projectId })
    ).sort({ order: 1 });
    res.json({ success: true, statuses });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/workflow-statuses  (admin/manager only — see route middleware)
exports.createWorkflowStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, category, color } = req.body;

    const last = await WorkflowStatus.findOne({ projectId, deletedAt: null }).sort({ order: -1 });
    const status = await WorkflowStatus.create({
      organizationId: req.user.organizationId,
      projectId,
      name,
      category,
      color,
      order: last ? last.order + 1 : 0,
    });

    res.status(201).json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/workflow-statuses/:id  (admin/manager only)
exports.updateWorkflowStatus = async (req, res, next) => {
  try {
    const status = await WorkflowStatus.findOneAndUpdate(
      req.scope({ _id: req.params.id, projectId: req.params.projectId }),
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!status) throw new ApiError(404, 'Workflow status not found');
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/workflow-statuses/:id  (admin/manager only)
// Blocked if any non-deleted issue is still using this status — must be reassigned first.
exports.deleteWorkflowStatus = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const inUse = await Issue.exists(req.scope({ projectId, statusId: id }));
    if (inUse) {
      throw new ApiError(409, 'Reassign issues off this status before deleting it');
    }

    const status = await WorkflowStatus.findOneAndUpdate(
      req.scope({ _id: id, projectId }),
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!status) throw new ApiError(404, 'Workflow status not found');

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
