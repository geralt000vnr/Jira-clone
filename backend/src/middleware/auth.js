const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const ApiError = require('../utils/ApiError');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid Authorization header'));
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.sub, organizationId: payload.orgId, isOrgOwner: payload.isOrgOwner };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
