const SavedFilter = require('../models/SavedFilter');
const ApiError = require('../utils/ApiError');

// GET /api/projects/:projectId/saved-filters — own filters plus any shared by teammates
exports.listSavedFilters = async (req, res, next) => {
  try {
    const filters = await SavedFilter.find({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      $or: [{ userId: req.user.id }, { isShared: true }],
    }).sort({ createdAt: -1 });
    res.json({ success: true, filters });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/saved-filters
exports.createSavedFilter = async (req, res, next) => {
  try {
    const { name, filters, isShared } = req.body;
    const savedFilter = await SavedFilter.create({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      userId: req.user.id,
      name,
      filters,
      isShared,
    });
    res.status(201).json({ success: true, filter: savedFilter });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/saved-filters/:id — owner-only
exports.deleteSavedFilter = async (req, res, next) => {
  try {
    const savedFilter = await SavedFilter.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!savedFilter) throw new ApiError(404, 'Saved filter not found');
    if (String(savedFilter.userId) !== String(req.user.id)) {
      throw new ApiError(403, 'Only the owner can delete this saved filter');
    }
    await savedFilter.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
