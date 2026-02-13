# OAuth Authentication Setup Guide

## ✅ Fixes Applied

### 1. Callback URL Configuration
**Updated files:**
- `src/server/passport.js` - Changed relative callback URLs to absolute URLs
- `.env` - Added explicit callback URL configuration

**Changes:**
```
✓ Google:   /api/auth/google/callback   → http://localhost:3000/api/auth/google/callback
✓ LinkedIn: Already configured correctly → http://localhost:3000/api/auth/linkedin/callback  
✓ GitHub:   /api/auth/github/callback   → http://localhost:3000/api/auth/github/callback
```

### 2. Client URL Fixed
```
✓ CLIENT_URL: http://localhost:5173 → http://localhost:5179
```
This ensures OAuth successful login redirects to the correct frontend port.

### 3. Environment Variables Added
```env
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

---

## 🔧 Required Actions - Configure OAuth Provider Consoles

To make OAuth authentication work, you MUST configure the callback URLs in each OAuth provider's console:

### 1. Google Cloud Console

**Steps:**
1. Go to https://console.cloud.google.com/
2. Select your project (or create one)
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. Click **Save**

**Current Configuration:**
- Client ID: `711962256079-bg42kai5kek603d3krsr7kem302jo9bk.apps.googleusercontent.com`

---

### 2. LinkedIn Developer Portal

**Steps:**
1. Go to https://www.linkedin.com/developers/apps
2. Select your app (or create one)
3. Navigate to **Auth** tab
4. Under **OAuth 2.0 settings** → **Redirect URLs**, add:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```
5. Click **Update**

**Current Configuration:**
- Client ID: `86t4znd2ty1cjt`

**Note:** LinkedIn requires the following OAuth scopes:
- `openid`
- `profile`
- `email`

---

### 3. GitHub OAuth Apps

**Steps:**
1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → Select your app (or create new)
3. Under **Authorization callback URL**, set:
   ```
   http://localhost:3000/api/auth/github/callback
   ```
4. Click **Update application**

**Current Configuration:**
- Client ID: `Ov23likC8TWuclDikhdO`

---

## 🚀 Testing OAuth Authentication

### OAuth Login URLs
Users can initiate OAuth login by navigating to:

| Provider | URL |
|----------|-----|
| Google | `http://localhost:3000/api/auth/google` |
| LinkedIn | `http://localhost:3000/api/auth/linkedin` |
| GitHub | `http://localhost:3000/api/auth/github` |

### Expected Flow
1. User clicks "Login with Google/LinkedIn/GitHub" on frontend
2. Frontend redirects to: `http://localhost:3000/api/auth/{provider}`
3. Backend redirects to OAuth provider's authorization page
4. User authorizes the app
5. OAuth provider redirects back to: `http://localhost:3000/api/auth/{provider}/callback`
6. Backend processes authentication and creates JWT token
7. Backend redirects to frontend: `http://localhost:5179/login?oauth=success&token={JWT_TOKEN}`
8. Frontend stores token and logs user in

### Success Response
After successful OAuth login, the user will be redirected to:
```
http://localhost:5179/login?oauth=success&token={YOUR_JWT_TOKEN}&provider={google|linkedin|github}
```

### Error Response
If OAuth fails, the user will be redirected to:
```
http://localhost:5179/login?oauth=error&provider={provider}&reason={error_reason}
```

---

## 🔍 Troubleshooting

### Issue: "redirect_uri_mismatch" error

**Cause:** The callback URL in your code doesn't match what's configured in the OAuth provider console.

**Solution:**
1. Check the exact callback URL in the error message
2. Make sure it matches exactly in the provider console (including protocol, domain, port, and path)
3. No trailing slashes
4. Must use `http://` for localhost (not `https://`)

### Issue: OAuth works but redirects to wrong port (5173 instead of 5179)

**Solution:** Already fixed! The `.env` file now has `CLIENT_URL=http://localhost:5179`

### Issue: "Client authentication failed" error

**Cause:** Invalid Client ID or Client Secret.

**Solution:**
1. Double-check the credentials in `.env` file
2. Regenerate credentials from OAuth provider console if needed
3. Restart the backend server after updating `.env`

---

## 📝 Current System Status

### Backend
- **URL:** http://localhost:3000
- **Status:** ✓ Configured with OAuth support
- **OAuth Endpoints:**
  - `/api/auth/google`
  - `/api/auth/google/callback`
  - `/api/auth/linkedin`
  - `/api/auth/linkedin/callback`
  - `/api/auth/github`
  - `/api/auth/github/callback`

### Frontend
- **URL:** http://localhost:5179
- **Status:** ✓ Will receive OAuth tokens correctly

### Test OAuth
Run the test script:
```bash
node scripts/test-oauth.js
```

---

## ⚠️ Production Deployment Notes

When deploying to production, you'll need to:

1. **Update callback URLs** to your production domain:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://yourdomain.com/api/auth/linkedin/callback
   https://yourdomain.com/api/auth/github/callback
   ```

2. **Update CLIENT_URL** in production `.env`:
   ```
   CLIENT_URL=https://yourdomain.com
   ```

3. **Add production URLs** to each OAuth provider console

4. **Use HTTPS** (required by most OAuth providers in production)

---

## 🎯 Quick Checklist

- [x] Fix callback URLs in passport.js
- [x] Add callback URLs to .env
- [x] Fix CLIENT_URL to port 5179
- [x] Restart backend server
- [ ] Configure Google Cloud Console callback URL
- [ ] Configure LinkedIn Developer Portal callback URL
- [ ] Configure GitHub OAuth App callback URL
- [ ] Test each OAuth provider login

---

**Last Updated:** 2026-02-14
**Backend Status:** Running with OAuth support
**Frontend Status:** Running on port 5179
