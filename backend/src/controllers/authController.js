const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');

function issueToken(user) {
  return jwt.sign(
    { sub: user._id, orgId: user.organizationId, isOrgOwner: user.isOrgOwner },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup  — creates a new org + first user (org owner)
exports.signup = async (req, res, next) => {
  try {
    const { orgName, name, email, password } = req.body;

    const slug = orgName.toLowerCase().trim().replace(/\s+/g, '-');
    const org = await Organization.create({ name: orgName, slug, ownerId: null });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      organizationId: org._id,
      name,
      email,
      passwordHash,
      isOrgOwner: true,
    });

    org.ownerId = user._id;
    await org.save();

    const token = issueToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, name, email, organizationId: org._id } });
  } catch (err) {
    if (err.code === 11000) return next(new ApiError(409, 'An organization or user with that value already exists'));
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deletedAt: null });
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    const token = issueToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email, organizationId: user.organizationId } });
  } catch (err) {
    next(err);
  }
};
