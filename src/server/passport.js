// Load environment variables
require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const crypto = require('crypto');

// Helper: upsert an OAuth user into the DB
const upsertOAuthUser = async ({ email, firstName, lastName, provider, providerId }) => {
  let UserModel = null;
  try {
    const { User } = require('../models/User');
    UserModel = User();
  } catch (_) {
    // DB unavailable — return a transient user object so auth still works
  }

  if (UserModel) {
    try {
      let user = await UserModel.findOne({ where: { email } });
      if (!user) {
        user = await UserModel.create({
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          password: crypto.randomBytes(32).toString('hex'), // unusable random password
          role: 'jobseeker',
          isVerified: true,
          isActive: true
        });
      }
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider,
        providerId
      };
    } catch (dbError) {
      console.warn(`Could not upsert ${provider} user in DB:`, dbError.message);
    }
  }

  // Fallback: transient object (survives this request only)
  return {
    id: `${provider}_${providerId || Date.now()}`,
    email,
    firstName: firstName || 'User',
    lastName: lastName || '',
    role: 'jobseeker',
    provider,
    providerId
  };
};

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

        const user = await upsertOAuthUser({
          email,
          firstName: profile.name?.givenName || 'User',
          lastName: profile.name?.familyName || '',
          provider: 'google',
          providerId: profile.id
        });

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
        const email = profile.email || profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in LinkedIn profile'), null);
        }

        const user = await upsertOAuthUser({
          email,
          firstName: profile.name?.givenName || profile.given_name || 'User',
          lastName: profile.name?.familyName || profile.family_name || '',
          provider: 'linkedin',
          providerId: profile.id
        });

        return done(null, user);
      } catch (error) {
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

        const user = await upsertOAuthUser({
          email,
          firstName: profile.displayName?.split(' ')[0] || profile.username || 'User',
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
          provider: 'github',
          providerId: String(profile.id)
        });

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
