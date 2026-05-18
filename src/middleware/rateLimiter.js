const rateLimit = require('express-rate-limit');

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : Number(process.env.API_RATE_LIMIT_MAX || 500),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : Number(process.env.UPLOAD_RATE_LIMIT_MAX || 20),
  message: { error: 'Upload limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const mlLimiter = rateLimit({
  windowMs: Number(process.env.ML_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.ML_RATE_LIMIT_MAX || isDev ? 2000 : 600),
  message: { error: 'AI processing limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, mlLimiter };
