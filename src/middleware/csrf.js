const csrf = require('csurf');

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Custom CSRF middleware that allows JWT authentication
const csrfWithJWT = (req, res, next) => {
  // Skip CSRF for API routes that use JWT authentication
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }
  
  // Apply CSRF protection for other routes
  return csrfProtection(req, res, next);
};

module.exports = {
  csrfProtection,
  csrfWithJWT
};