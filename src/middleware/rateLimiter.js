const rateLimit = require('express-rate-limit');

// Central rate limiter definitions — single source of truth.
// server/index.js mounts these; individual routes should NOT redefine them.

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth limiter: 10 failed attempts per 15 min per IP.
// skipSuccessfulRequests means successful logins don't count against the window.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,
  message: { error: 'Upload limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const mlLimiter = rateLimit({
  windowMs: Number(process.env.ML_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.ML_RATE_LIMIT_MAX) || 60,
  message: { error: 'AI processing limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, mlLimiter };
