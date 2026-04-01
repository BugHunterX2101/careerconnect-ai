const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Try to import User model (optional)
let userModel = null;
try {
  userModel = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

const getUser = () => {
  if (!userModel) {
    return null;
  }

  if (typeof userModel.findByPk === 'function') {
    return userModel;
  }

  if (typeof userModel.User === 'function') {
    try {
      return userModel.User();
    } catch (error) {
      console.warn('Failed to initialize User model:', error.message);
      return null;
    }
  }

  return null;
};

if (!process.env.JWT_SECRET) {
  console.warn('Warning: Using fallback JWT secret key. Set JWT_SECRET in environment for security.');
}

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const UserModel = getUser();
    if (UserModel) {
      try {
        const user = await UserModel.findByPk(decoded.userId);
        if (!user) {
          // For OAuth users, this is expected - they're not in the database
          // We'll rely on the JWT token data instead
          if (!decoded.provider || decoded.provider === 'local') {
            return res.status(401).json({ error: 'User not found' });
          }
          // OAuth user - continue with token validation only
          console.log('OAuth user authentication - using token data');
        } else {
          if (user.isActive === false) {
            return res.status(401).json({ error: 'Account is deactivated' });
          }
          req.userData = user;
        }
      } catch (dbError) {
        console.warn('Database check failed, continuing with token validation only:', dbError.message);
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authorize specific roles
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      const UserModel = getUser();
      if (UserModel) {
        try {
          const user = await UserModel.findByPk(decoded.userId);
          if (user && user.isActive) {
            req.userData = user;
          }
        } catch (dbError) {
          // DB lookup failed — req.user already set from token, continue
        }
      }
    }

    next();
  } catch (error) {
    // Token invalid or expired — continue without authentication
    next();
  }
};

// Check resource ownership
const checkOwnership = (model, field = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!model) {
        return res.status(503).json({ error: 'Model not available' });
      }

      const resourceId = req.params.id;
      const resource = await model.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource[field].toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to access this resource' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters
const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  30, // 30 requests per window
  'Too many authentication attempts, please try again later.'
);

const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests per window
  'Too many requests, please try again later.'
);

const uploadRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.'
);

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth,
  checkOwnership,
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter
};
