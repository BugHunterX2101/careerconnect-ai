const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./auth');
const { sanitizeForLog } = require('../utils/inputSanitizer');

// Enhanced rate limiting for different endpoint types
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn('Rate limit exceeded:', sanitizeForLog(req.ip));
    res.status(429).json({ error: message });
  }
});

// Different rate limits for different operations
const rateLimits = {
  auth: createRateLimit(15 * 60 * 1000, 30, 'Too many authentication attempts'),
  api: createRateLimit(15 * 60 * 1000, 200, 'Too many API requests'),
  upload: createRateLimit(60 * 60 * 1000, 10, 'Too many upload attempts'),
  search: createRateLimit(60 * 1000, 60, 'Too many search requests')
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      console.warn('Unauthorized access attempt:', {
        userId: sanitizeForLog(req.user.userId),
        role: sanitizeForLog(userRole),
        requiredRoles: roles,
        endpoint: sanitizeForLog(req.path)
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Enhanced authentication middleware with logging
const secureAuth = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) {
      console.warn('Authentication failed:', {
        ip: sanitizeForLog(req.ip),
        userAgent: sanitizeForLog(req.get('User-Agent')),
        endpoint: sanitizeForLog(req.path)
      });
    }
    next(err);
  });
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.warn('Input validation failed:', {
        error: sanitizeForLog(error.message),
        endpoint: sanitizeForLog(req.path)
      });
      return res.status(400).json({ 
        error: 'Invalid input',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // For OAuth: Allow from same origin (SAMEORIGIN) instead of DENY to permit OAuth flows
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

module.exports = {
  rateLimits,
  requireRole,
  secureAuth,
  validateInput,
  securityHeaders
};