const rateLimit = require('express-rate-limit');
const { redisUrl } = require('../config/env');

// Rate limit counters default to express-rate-limit's built-in in-memory store, which is
// fine for a single instance but resets per-process and doesn't share state across
// instances. If REDIS_URL is configured, use a shared Redis-backed store instead — no
// code changes needed elsewhere, and local dev without Redis keeps working unchanged.
function buildStore() {
  if (!redisUrl) return undefined;
  const Redis = require('ioredis');
  const { RedisStore } = require('rate-limit-redis');
  const client = new Redis(redisUrl);
  // ioredis throws an uncaught exception on an unhandled 'error' event — attach a
  // listener so a Redis outage logs instead of crashing the whole server.
  client.on('error', (err) => console.error('Redis rate-limit store error:', err.message));
  return new RedisStore({ sendCommand: (...args) => client.call(...args) });
}

// Blunts credential-stuffing / brute-force attempts against login and signup.
// Keyed by IP; 10 attempts per 15 minutes is generous for real users, punishing for scripts.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore(),
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
