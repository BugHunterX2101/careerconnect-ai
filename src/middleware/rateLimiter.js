const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit exceeded, please try again later'
});

const mlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'AI processing limit exceeded'
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, mlLimiter };
