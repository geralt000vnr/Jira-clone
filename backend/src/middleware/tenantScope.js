// Attaches a helper the controllers MUST use instead of raw model queries,
// so organizationId scoping is centralized rather than repeated (and possibly forgotten).
module.exports = function tenantScope(req, res, next) {
  req.scope = (filter = {}) => ({ ...filter, organizationId: req.user.organizationId, deletedAt: null });
  next();
};
