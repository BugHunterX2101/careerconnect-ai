const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
// Simple auth middleware since the imported one might be missing
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

// Try to import User model (optional)
let UserModelModule = null;
try {
  UserModelModule = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

function getUser() {
  if (!UserModelModule) {
    return null;
  }
  // Call the User function to get the actual Sequelize model
  if (typeof UserModelModule.User === 'function') {
    try {
      return UserModelModule.User();
    } catch (error) {
      console.warn('Failed to get User model:', error.message);
      return null;
    }
  }
  return UserModelModule;
}

const router = express.Router();


const providerConfigMap = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  linkedin: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
};

const isProviderConfigured = (provider) => {
  const vars = providerConfigMap[provider] || [];
  return vars.every((key) => !!process.env[key]);
};

// Test endpoint to verify auth routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      google: 'GET /api/auth/google',
      linkedin: 'GET /api/auth/linkedin',
      github: 'GET /api/auth/github',
      githubCallback: 'GET /api/auth/github/callback'
    },
    oauth: {
      google: {
        configured: isProviderConfigured('google'),
        hasStrategy: !!(passport._strategies && passport._strategies.google),
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
      },
      linkedin: {
        configured: isProviderConfigured('linkedin'),
        hasStrategy: !!(passport._strategies && passport._strategies.linkedin),
        clientId: process.env.LINKEDIN_CLIENT_ID ? 'Present' : 'Missing',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET ? 'Present' : 'Missing',
        callbackUrl: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback'
      },
      github: {
        configured: isProviderConfigured('github'),
        hasRoutes: true,
        callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback'
      }
    }
  });
});

// Debug route for GitHub callback
router.get('/github/callback/test', (req, res) => {
  res.json({ 
    message: 'GitHub callback route is accessible',
    timestamp: new Date().toISOString(),
    url: req.url,
    query: req.query
  });
});

// Debug route for LinkedIn callback
router.get('/linkedin/callback/test', (req, res) => {
  res.json({ 
    message: 'LinkedIn callback route is accessible',
    timestamp: new Date().toISOString(),
    url: req.url,
    query: req.query,
    linkedin: {
      configured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      strategy: passport._strategies && passport._strategies.linkedin ? 'Registered' : 'Not registered'
    }
  });
});

// Test LinkedIn OAuth URL generation
router.get('/linkedin/test', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback';
  const scope = 'r_liteprofile r_emailaddress';
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  
  res.json({
    message: 'LinkedIn OAuth test endpoint',
    clientId: clientId ? 'Present' : 'Missing',
    redirectUri,
    scope,
    authUrl,
    timestamp: new Date().toISOString()
  });
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['jobseeker', 'employer']).withMessage('Role must be either jobseeker or employer'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// @desc    Register a new user
// @access  Public
router.post('/register', csrfProtection, authLimiter, validateRegistration, async (req, res) => {
  try {
    console.log('Registration attempt:', {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      hasPassword: !!req.body.password
    });
    
    // Validate input first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: errors.array()[0].msg || 'Validation failed',
        details: errors.array()
      });
    }

    const UserModel = getUser();
    if (!UserModel) {
      console.log('User model not available');
      return res.status(503).json({ 
        success: false,
        error: 'Database not available',
        message: 'User registration is temporarily unavailable. Please try again later.'
      });
    }

    const { email, password, firstName, lastName, role, company } = req.body;
    console.log('Creating user with data:', { email, firstName, lastName, role });

    // Check if user already exists
    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user (password will be hashed by the model hook)
    const user = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      role,
      company: role === 'employer' ? company : undefined
    });

    console.log('User created successfully:', String(user.id).replace(/[\n\r\t]/g, ''));

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        iss: 'careerconnect-api',
        sub: user.id.toString()
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const UserModel = getUser();
    if (!UserModel) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        iss: 'careerconnect-api',
        sub: user.id.toString()
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Check if this is an OAuth user (has provider field and it's not 'local')
    const isOAuthUser = req.user.provider && req.user.provider !== 'local';
    
    if (isOAuthUser) {
      // For OAuth users, return data from JWT token
      return res.json({ 
        user: {
          id: req.user.userId,
          email: req.user.email,
          role: req.user.role || 'jobseeker',
          firstName: req.user.firstName || 'User',
          lastName: req.user.lastName || '',
          provider: req.user.provider
        }
      });
    }
    
    // For local users, try to get from database
    const UserModel = getUser();
    if (!UserModel) {
      // Return basic user data when database is not available
      return res.json({ 
        user: {
          id: req.user.userId,
          email: req.user.email,
          role: req.user.role || 'jobseeker',
          firstName: 'User',
          lastName: '',
          provider: 'local'
        }
      });
    }

    const user = await UserModel.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// OAuth headers middleware - permits OAuth flows
const oauthHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  next();
};

// OAuth: Google
router.get('/google', oauthHeaders, (req, res, next) => {
  console.log('Google OAuth initiated');
  if (!isProviderConfigured('google')) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`
  })(req, res, next);
});

router.get('/google/callback', oauthHeaders, passport.authenticate('google', { session: false, failureRedirect: '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider || 'google',
        iat: Math.floor(Date.now() / 1000),
        iss: 'careerconnect-api',
        sub: user.id.toString()
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=success&token=${token}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error`);
  }
});

// OAuth: LinkedIn
router.get('/linkedin', oauthHeaders, (req, res) => {
  console.log('🔵 LinkedIn OAuth route hit');
  if (!isProviderConfigured('linkedin')) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=linkedin_not_configured`);
  }
  
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback';
  const scope = 'openid profile email';
  
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  
  if (!clientId) {
    console.error('❌ LinkedIn Client ID missing');
    return res.redirect(`${process.env.CLIENT_URL}/login?error=linkedin_not_configured`);
  }
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  
  console.log('🔵 Redirecting to LinkedIn:', authUrl);
  res.redirect(authUrl);
});

router.get('/linkedin/callback', oauthHeaders, async (req, res) => {
  const { code, error } = req.query;

  console.log('LINKEDIN CODE:', code || 'not-provided');
  
  if (error) {
    console.error('❌ LinkedIn OAuth error:', error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=linkedin&reason=${error}`);
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=linkedin&reason=no_code`);
  }
  
  try {
    const linkedinCallbackUrl = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback';
    const linkedinTokenPayload = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: linkedinCallbackUrl,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET
    });

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', linkedinTokenPayload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const accessToken = tokenResponse.data.access_token;
    const expiresIn = tokenResponse.data.expires_in;
    console.log('ACCESS TOKEN:', accessToken || 'not-returned');
    console.log('ACCESS TOKEN EXPIRES IN:', expiresIn || 'unknown');

    // Keep the latest member token available for LinkedIn API routes in this process.
    process.env.LINKEDIN_MEMBER_ACCESS_TOKEN = accessToken;

    // Make the latest LinkedIn OAuth token available to runtime services for testing.
    try {
      const { linkedinService } = require('../services/linkedinService');
      if (linkedinService && typeof linkedinService.setAccessToken === 'function') {
        linkedinService.setAccessToken(accessToken);
      }
    } catch (serviceError) {
      console.warn('Could not set runtime LinkedIn token:', serviceError.message);
    }
    
    // Prefer OIDC userinfo for openid profile email scopes.
    let profile;
    let email;
    try {
      const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const userInfo = userInfoResponse.data || {};
      profile = {
        id: userInfo.sub,
        localizedFirstName: userInfo.given_name,
        localizedLastName: userInfo.family_name
      };
      email = userInfo.email;
    } catch (userInfoError) {
      // Backward-compatible fallback for apps still using legacy LinkedIn profile scopes.
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      profile = profileResponse.data;
      email = emailResponse.data?.elements?.[0]?.['handle~']?.emailAddress;
      console.warn('LinkedIn OIDC userinfo unavailable, used legacy profile endpoints:', userInfoError.response?.data || userInfoError.message);
    }

    if (!email) {
      throw new Error('LinkedIn account email not available from OAuth profile');
    }
    
    const user = {
      id: Date.now().toString(),
      email,
      firstName: profile.localizedFirstName || 'User',
      lastName: profile.localizedLastName || '',
      role: 'jobseeker',
      provider: 'linkedin',
      providerId: profile.id || profile.sub
    };
    
    console.log('✅ LinkedIn OAuth success, user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      provider: user.provider
    });
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        iat: Math.floor(Date.now() / 1000),
        iss: 'careerconnect-api',
        sub: user.id.toString()
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );
    
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?oauth=success&token=${token}&provider=linkedin`;
    console.log('🔄 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ LinkedIn OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=linkedin&reason=token_exchange_failed`);
  }
});

// OAuth: GitHub
router.get('/github', oauthHeaders, (req, res) => {
  console.log('🔵 GitHub OAuth initiated');
  if (!isProviderConfigured('github')) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=github_not_configured`);
  }
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
  const scope = 'user:email';
  
  if (!clientId) {
    console.error('❌ GitHub Client ID missing');
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=github_not_configured`);
  }
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  
  console.log('🔵 Redirecting to GitHub:', authUrl);
  res.redirect(authUrl);
});

router.get('/github/callback', oauthHeaders, async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('❌ GitHub OAuth error:', error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=github&reason=${error}`);
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=github&reason=no_code`);
  }
  
  try {
    const githubTokenPayload = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: String(code)
    });

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', githubTokenPayload.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    // Get user email
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const profile = userResponse.data;
    const primaryEmail = emailResponse.data.find(email => email.primary);
    
    const user = {
      id: Date.now().toString(),
      email: primaryEmail?.email || `${profile.login}@github.local`,
      firstName: profile.name?.split(' ')[0] || profile.login,
      lastName: profile.name?.split(' ')[1] || '',
      role: 'jobseeker',
      provider: 'github',
      providerId: profile.id
    };
    
    console.log('✅ GitHub OAuth success, user:', user);
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        iat: Math.floor(Date.now() / 1000),
        iss: 'careerconnect-api',
        sub: user.id.toString()
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );
    
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=success&token=${token}&provider=github`;
    console.log('🔄 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?oauth=error&provider=github&reason=token_exchange_failed`);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;