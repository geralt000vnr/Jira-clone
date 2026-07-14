const rateLimit = require('express-rate-limit');

// Blunts credential-stuffing / brute-force attempts against login and signup.
// Keyed by IP; 10 attempts per 15 minutes is generous for real users, punishing for scripts.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
