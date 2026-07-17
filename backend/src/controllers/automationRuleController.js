const AutomationRule = require('../models/AutomationRule');
const ApiError = require('../utils/ApiError');

// GET /api/projects/:projectId/automation-rules
exports.listAutomationRules = async (req, res, next) => {
  try {
    const rules = await AutomationRule.find(req.scope({ projectId: req.params.projectId })).sort({ order: 1 });
    res.json({ success: true, rules });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/automation-rules  (admin/manager only — see route middleware)
exports.createAutomationRule = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, trigger, conditionField, conditionValue, actionType, actionValue, enabled } = req.body;

    const last = await AutomationRule.findOne({ projectId, deletedAt: null }).sort({ order: -1 });
    const rule = await AutomationRule.create({
      organizationId: req.user.organizationId,
      projectId,
      name,
      trigger,
      conditionField: conditionField ?? null,
      conditionValue: conditionValue ?? null,
      actionType,
      actionValue: actionValue ?? null,
      enabled,
      order: last ? last.order + 1 : 0,
    });

    res.status(201).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/automation-rules/:id  (admin/manager only)
exports.updateAutomationRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOneAndUpdate(
      req.scope({ _id: req.params.id, projectId: req.params.projectId }),
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!rule) throw new ApiError(404, 'Automation rule not found');
    res.json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/automation-rules/:id  (admin/manager only)
exports.deleteAutomationRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOneAndUpdate(
      req.scope({ _id: req.params.id, projectId: req.params.projectId }),
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!rule) throw new ApiError(404, 'Automation rule not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
