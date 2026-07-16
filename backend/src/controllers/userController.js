const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// GET /api/users?email=  — org-scoped lookup so ProjectMembers can add people by email
// instead of a raw Mongo id. Deliberately exact-match only (no partial/prefix search),
// to avoid turning this into a way to enumerate every user in the organization.
exports.lookupByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({
      organizationId: req.user.organizationId,
      email: email.toLowerCase(),
      deletedAt: null,
    }).select('name email avatarUrl');

    if (!user) throw new ApiError(404, 'No user with that email in your organization');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
