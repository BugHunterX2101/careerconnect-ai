# 🚀 Deployment Guide

## 📋 **Deployment Options**

### 1. **Vercel (Recommended)**
- **Best for**: Full-stack applications with serverless functions
- **Pros**: Easy setup, automatic deployments, great performance
- **Cons**: Limited serverless function execution time

### 2. **Heroku**
- **Best for**: Traditional Node.js applications
- **Pros**: Good for long-running processes, background jobs
- **Cons**: Requires credit card for verification

### 3. **Netlify**
- **Best for**: Frontend-only deployments
- **Pros**: Great for static sites, easy setup
- **Cons**: Limited backend support

## 🎯 **Vercel Deployment (Recommended)**

### Step 1: Prepare for Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

### Step 2: Environment Variables

Set up environment variables in Vercel dashboard:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careerconnect_ai
REDIS_URL=redis://username:password@host:port

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App Configuration
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
```

### Step 3: Deploy

1. **Deploy from GitHub**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

2. **Deploy via CLI**:
   ```bash
   vercel --prod
   ```

### Step 4: Configure Domains

1. **Custom Domain** (Optional):
   - Go to Vercel project settings
   - Add custom domain
   - Update DNS records

2. **Update OAuth Redirect URIs**:
   - Google: `https://your-app.vercel.app/api/auth/google/callback`
   - LinkedIn: `https://your-app.vercel.app/api/auth/linkedin/callback`
   - GitHub: `https://your-app.vercel.app/api/auth/github/callback`

## 🐳 **Heroku Deployment**

### Step 1: Prepare for Heroku

1. **Install Heroku CLI**:
   ```bash
   # Windows
   winget install --id=Heroku.HerokuCLI
   
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

### Step 2: Create Heroku App

```bash
heroku create your-app-name
```

### Step 3: Add Buildpacks

```bash
heroku buildpacks:add heroku/nodejs
```

### Step 4: Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... add all other environment variables
```

### Step 5: Deploy

```bash
git push heroku main
```

## 🌐 **Netlify Deployment (Frontend Only)**

### Step 1: Build Frontend

```bash
cd src/client
npm run build
```

### Step 2: Deploy

1. **Drag and Drop**:
   - Go to [Netlify](https://netlify.com)
   - Drag `src/client/dist` folder to deploy

2. **Git Integration**:
   - Connect GitHub repository
   - Set build command: `cd src/client && npm run build`
   - Set publish directory: `src/client/dist`

## 🔧 **Database Setup**

### MongoDB Atlas (Recommended)

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create free cluster
   - Get connection string

2. **Configure Network Access**:
   - Add IP address: `0.0.0.0/0` (for all IPs)
   - Or add specific IPs for security

3. **Create Database User**:
   - Username and password
   - Grant read/write permissions

### Redis Cloud

1. **Create Database**:
   - Go to [Redis Cloud](https://redis.com/try-free/)
   - Create free database
   - Get connection string

## 📊 **Monitoring & Analytics**

### Vercel Analytics

```bash
npm install @vercel/analytics
```

### Error Tracking

```bash
npm install @sentry/node @sentry/react
```

## 🔒 **Security Checklist**

- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] JWT tokens secured
- [ ] Database connections secured
- [ ] File uploads validated

## 🚨 **Troubleshooting**

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Check for syntax errors

2. **Database Connection**:
   - Verify connection string
   - Check network access
   - Test connection locally

3. **Environment Variables**:
   - Ensure all required variables set
   - Check variable names (case-sensitive)
   - Verify no extra spaces

4. **CORS Issues**:
   - Update CORS origins for production
   - Check frontend URL configuration
   - Verify API endpoints

## 📈 **Performance Optimization**

### Frontend

- Enable code splitting
- Optimize images
- Use CDN for static assets
- Implement caching

### Backend

- Enable compression
- Optimize database queries
- Implement caching
- Use connection pooling

## 🔄 **Continuous Deployment**

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 **Support**

For deployment issues:
1. Check Vercel/Heroku/Netlify logs
2. Verify environment variables
3. Test locally first
4. Check documentation

## 🎉 **Success Checklist**

- [ ] Application deployed successfully
- [ ] Database connected
- [ ] Authentication working
- [ ] File uploads functional
- [ ] Real-time features working
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backup strategy implemented
