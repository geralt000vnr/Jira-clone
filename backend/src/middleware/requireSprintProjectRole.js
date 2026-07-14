const Sprint = require('../models/Sprint');
const ProjectMember = require('../models/ProjectMember');
const ApiError = require('../utils/ApiError');

// Same purpose as requireProjectRole, but for routes keyed by sprint id rather than project id:
// looks the sprint up first, then checks the caller's role on *its* project.
module.exports = function requireSprintProjectRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const sprint = await Sprint.findOne({
        _id: req.params.id,
        organizationId: req.user.organizationId,
      });
      if (!sprint) return next(new ApiError(404, 'Sprint not found'));

      const membership = await ProjectMember.findOne({
        projectId: sprint.projectId,
        userId: req.user.id,
        organizationId: req.user.organizationId,
      });
      if (!membership) return next(new ApiError(403, "Not a member of this sprint's project"));
      if (!allowedRoles.includes(membership.role)) {
        return next(new ApiError(403, `Requires one of roles: ${allowedRoles.join(', ')}`));
      }

      req.sprint = sprint; // avoids a duplicate lookup in the controller
      req.projectRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};
