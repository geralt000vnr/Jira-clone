const ProjectMember = require('../models/ProjectMember');
const ApiError = require('../utils/ApiError');

// usage: requireProjectRole(['admin', 'manager'])
module.exports = function requireProjectRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) return next(new ApiError(400, 'projectId is required'));

      const membership = await ProjectMember.findOne({
        projectId,
        userId: req.user.id,
        organizationId: req.user.organizationId,
      });

      if (!membership) return next(new ApiError(403, 'Not a member of this project'));
      if (!allowedRoles.includes(membership.role)) {
        return next(new ApiError(403, `Requires one of roles: ${allowedRoles.join(', ')}`));
      }
      req.projectRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};
