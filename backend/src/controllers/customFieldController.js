const CustomField = require('../models/CustomField');
const ApiError = require('../utils/ApiError');

// GET /api/projects/:projectId/custom-fields
exports.listCustomFields = async (req, res, next) => {
  try {
    const fields = await CustomField.find(req.scope({ projectId: req.params.projectId })).sort({ order: 1 });
    res.json({ success: true, fields });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/custom-fields  (admin/manager only — see route middleware)
exports.createCustomField = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, type, options } = req.body;

    const last = await CustomField.findOne({ projectId, deletedAt: null }).sort({ order: -1 });
    const field = await CustomField.create({
      organizationId: req.user.organizationId,
      projectId,
      name,
      type,
      options,
      order: last ? last.order + 1 : 0,
    });

    res.status(201).json({ success: true, field });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/custom-fields/:id  (admin/manager only)
exports.updateCustomField = async (req, res, next) => {
  try {
    const field = await CustomField.findOneAndUpdate(
      req.scope({ _id: req.params.id, projectId: req.params.projectId }),
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!field) throw new ApiError(404, 'Custom field not found');
    res.json({ success: true, field });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/custom-fields/:id  (admin/manager only)
// No in-use guard: a leftover key in some issue's customFieldValues after its
// definition is deleted is inert, not a referential-integrity break.
exports.deleteCustomField = async (req, res, next) => {
  try {
    const field = await CustomField.findOneAndUpdate(
      req.scope({ _id: req.params.id, projectId: req.params.projectId }),
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!field) throw new ApiError(404, 'Custom field not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
