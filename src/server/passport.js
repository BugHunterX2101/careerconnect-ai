// Load environment variables
require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

// Mock user model for OAuth
const mockUsers = new Map();

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key'
}, async (payload, done) => {
  try {
    return done(null, payload);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }
        
        let user = mockUsers.get(email);
        
        if (!user) {
          user = {
            id: Date.now().toString(),
            email,
            firstName: profile.name?.givenName || 'User',
            lastName: profile.name?.familyName || '',
            role: 'jobseeker',
            provider: 'google',
            providerId: profile.id
          };
          mockUsers.set(email, user);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
    console.log('✅ Google OAuth strategy registered');
  } catch (error) {
    console.log('❌ Google OAuth strategy registration failed:', error.message);
  }
} else {
  console.log('⚠️ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  try {
    passport.use('linkedin', new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback',
      scope: ['r_liteprofile', 'r_emailaddress'],
      state: false
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('LinkedIn profile received:', profile);
        
        const email = profile.email || profile.emails?.[0]?.value;
        if (!email) {
          console.log('No email found in LinkedIn profile');
          return done(new Error('No email found in LinkedIn profile'), null);
        }
        
        let user = mockUsers.get(email);
        
        if (!user) {
          user = {
            id: Date.now().toString(),
            email,
            firstName: profile.name?.givenName || profile.given_name || 'User',
            lastName: profile.name?.familyName || profile.family_name || '',
            role: 'jobseeker',
            provider: 'linkedin',
            providerId: profile.id
          };
          mockUsers.set(email, user);
          console.log('Created new LinkedIn user:', user.email);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('LinkedIn strategy error:', error);
        return done(error, null);
      }
    }));
    console.log('✅ LinkedIn OAuth strategy registered');
  } catch (error) {
    console.log('❌ LinkedIn OAuth strategy registration failed:', error.message);
  }
} else {
  console.log('⚠️ LinkedIn OAuth not configured - missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  try {
    passport.use('github', new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        let user = mockUsers.get(email);
        
        if (!user) {
          user = {
            id: Date.now().toString(),
            email,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ')[1] || '',
            role: 'jobseeker',
            provider: 'github',
            providerId: profile.id
          };
          mockUsers.set(email, user);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
    console.log('✅ GitHub OAuth strategy registered');
  } catch (error) {
    console.log('❌ GitHub OAuth strategy registration failed:', error.message);
  }
} else {
  console.log('⚠️ GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
}

module.exports = passport;