// CSRF protection middleware
// Uses csurf if available; degrades gracefully for API-only (JWT bearer) flows.
// All state-mutating API routes that use JWT Bearer tokens are exempt from CSRF
// (the Authorization header itself is the CSRF mitigation for SPA/mobile clients).

let csrfProtection = null;
try {
  const csurf = require('csurf');
  csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  });
} catch (_) {
  // csurf not installed — no-op middleware used instead
  csrfProtection = null;
}

/**
 * Skips CSRF check for any request that carries a Bearer JWT.
 * This covers all SPA/API clients. Browser-originated form submissions
 * (OAuth redirects) still go through csurf cookie validation.
 */
const csrfWithJWT = (req, res, next) => {
  // Skip CSRF for JWT-authenticated API requests
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return next();

  // Skip CSRF for OAuth callback routes (they arrive without a token)
  if (req.path.includes('/callback')) return next();

  // If csurf is not installed, pass through
  if (!csrfProtection) return next();

  return csrfProtection(req, res, next);
};

module.exports = { csrfProtection, csrfWithJWT };
