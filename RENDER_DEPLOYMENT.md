# 🚀 Render Deployment Guide

## 📋 **Prerequisites**

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas Account**: For database (free tier available)

## 🎯 **Step-by-Step Deployment**

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify your repository structure**:
   ```
   careerconnect-main/
   ├── render.yaml          # Render configuration
   ├── package.json         # Main dependencies
   ├── src/
   │   ├── server/
   │   │   └── index.js     # Main server file
   │   └── client/
   │       ├── package.json # Frontend dependencies
   │       └── src/         # React app
   └── scripts/
       └── build-production.js
   ```

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Set up database access (username/password)
   - Set up network access (allow all IPs: `0.0.0.0/0`)

2. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

### Step 3: Deploy on Render

1. **Connect GitHub Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select your repository

2. **Configure Services**:
   - Render will automatically detect the `render.yaml` file
   - Review the configuration:
     - **Backend Service**: `careerconnect-ai-backend`
     - **Frontend Service**: `careerconnect-ai-frontend`
     - **Database**: `careerconnect-mongodb`

3. **Set Environment Variables** (if needed):
   - Go to your backend service settings
   - Add any additional environment variables:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     SMTP_HOST=smtp.gmail.com
     SMTP_USER=your_email@gmail.com
     SMTP_PASS=your_app_password
     ```

4. **Deploy**:
   - Click "Create Blueprint Instance"
   - Render will automatically:
     - Create the MongoDB database
     - Deploy the backend service
     - Deploy the frontend service
     - Set up environment variables

### Step 4: Verify Deployment

1. **Check Backend Health**:
   - Visit: `https://careerconnect-ai-backend.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Check Frontend**:
   - Visit: `https://careerconnect-ai-frontend.onrender.com`
   - Should load the React application

3. **Test API Endpoints**:
   - Test registration: `POST https://careerconnect-ai-backend.onrender.com/api/auth/register`
   - Test login: `POST https://careerconnect-ai-backend.onrender.com/api/auth/login`

## 🔧 **Configuration Details**

### Backend Service (`careerconnect-ai-backend`)
- **Environment**: Node.js
- **Build Command**: `npm run build:production`
- **Start Command**: `npm start`
- **Health Check**: `/health`
- **Port**: 10000

### Frontend Service (`careerconnect-ai-frontend`)
- **Environment**: Static Site
- **Build Command**: `cd src/client && npm install && npm run build`
- **Publish Directory**: `src/client/dist`
- **Environment Variables**: Auto-configured for backend API

### Database (`careerconnect-mongodb`)
- **Type**: MongoDB
- **Plan**: Starter (Free)
- **Database Name**: `careerconnect_ai`
- **User**: `careerconnect_user`

## 🌐 **URLs After Deployment**

- **Frontend**: `https://careerconnect-ai-frontend.onrender.com`
- **Backend API**: `https://careerconnect-ai-backend.onrender.com/api`
- **Health Check**: `https://careerconnect-ai-backend.onrender.com/health`

## 🔒 **Security Features**

- **CORS**: Configured for production domains
- **Rate Limiting**: 100 requests per 15 minutes
- **JWT**: Auto-generated secrets
- **Helmet**: Security headers enabled
- **Input Validation**: Express-validator middleware

## 📊 **Monitoring**

1. **Logs**: Available in Render dashboard
2. **Health Checks**: Automatic monitoring
3. **Performance**: Built-in metrics

## 🚨 **Troubleshooting**

### Common Issues

1. **Build Failures**:
   - Check Node.js version (requires >=18.0.0)
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **Database Connection**:
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has proper permissions

3. **CORS Issues**:
   - Verify frontend URL in backend CORS configuration
   - Check environment variables
   - Test with browser developer tools

4. **Environment Variables**:
   - Ensure all required variables are set
   - Check variable names (case-sensitive)
   - Verify no extra spaces or quotes

### Debug Commands

```bash
# Check backend logs
curl https://careerconnect-ai-backend.onrender.com/health

# Test API endpoint
curl -X POST https://careerconnect-ai-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

## 🔄 **Updates and Maintenance**

1. **Automatic Deployments**: Enabled by default
2. **Manual Deployments**: Available in dashboard
3. **Rollback**: Previous versions can be restored
4. **Scaling**: Can upgrade to paid plans for more resources

## 📞 **Support**

- **Render Support**: [help.render.com](https://help.render.com)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Project Issues**: Check GitHub repository issues

## 🎉 **Success Checklist**

- [ ] Repository pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Render blueprint deployed
- [ ] Backend health check passes
- [ ] Frontend loads successfully
- [ ] API endpoints respond correctly
- [ ] Database connection working
- [ ] Environment variables configured
- [ ] CORS issues resolved
- [ ] Security features enabled

## 🚀 **Next Steps**

1. **Add OAuth Providers**: Configure Google, LinkedIn, GitHub
2. **Set Up Email**: Configure SMTP for notifications
3. **Add Analytics**: Integrate monitoring tools
4. **Custom Domain**: Set up custom domain names
5. **SSL Certificate**: Automatically provided by Render

Your CareerConnect AI application is now live on Render! 🎉
