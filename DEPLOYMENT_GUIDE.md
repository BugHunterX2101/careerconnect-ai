# CareerConnect AI - Deployment Guide

## Overview
This guide will help you deploy CareerConnect AI locally with the new PostgreSQL database and GPT-OSS-120B integration for enhanced job recommendations.

## Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher) - Optional for job queues
- **Git**

### Optional Software
- **Docker** (for containerized deployment)
- **PM2** (for production process management)

## Step 1: Database Setup

### Install PostgreSQL

#### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Note down the password you set for the `postgres` user

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE careerconnect_ai;
CREATE USER careerconnect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE careerconnect_ai TO careerconnect_user;
\q
```

## Step 2: Project Setup

### Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd careerconnect-main

# Install backend dependencies
npm install

# Install frontend dependencies
cd src/client
npm install
cd ../..
```

### Environment Configuration
```bash
# Copy environment files
cp env.example .env
cp src/client/env.example src/client/.env
```

### Update Environment Variables
Edit `.env` file with your configuration:

```env
# Database Configuration
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=careerconnect_ai
POSTGRES_USER=careerconnect_user
POSTGRES_PASSWORD=your_password
POSTGRES_URL=postgresql://careerconnect_user:your_password@localhost:5432/careerconnect_ai

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# AI/ML Configuration
GPT_OSS_API_KEY=your_gpt_oss_api_key_here
GPT_OSS_BASE_URL=https://api.openai.com/v1
GPT_OSS_MODEL=gpt-oss-120b

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
```

## Step 3: Database Initialization

### Run Database Setup
```bash
# Initialize database tables
npm run setup:db
```

This will:
- Connect to PostgreSQL
- Create all necessary tables
- Set up model associations
- Test the connection

## Step 4: Start the Application

### Development Mode
```bash
# Start both backend and frontend
npm run dev:full
```

Or start them separately:
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run dev:client
```

### Production Mode
```bash
# Build the application
npm run build:production

# Start production server
npm start
```

## Step 5: Verify Installation

### Health Check
Visit: `http://localhost:3000/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "2.0.0"
}
```

### Frontend
Visit: `http://localhost:5173`

### GPT-OSS Integration Test
The application will automatically use GPT-OSS-120B for job recommendations when:
- The API key is configured
- The `useGPTOSS: true` flag is set in job recommendation requests

## Step 6: Optional Redis Setup

### Install Redis

#### Windows
1. Download Redis for Windows from https://github.com/microsoftarchive/redis/releases
2. Install and start Redis service

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

## Troubleshooting

### Database Connection Issues
1. **Connection refused**: Ensure PostgreSQL is running
2. **Authentication failed**: Check username/password in `.env`
3. **Database doesn't exist**: Run the database creation commands

### GPT-OSS API Issues
1. **Invalid API key**: Verify the API key in `.env`
2. **Rate limiting**: Check API usage limits
3. **Network issues**: Ensure internet connectivity

### Port Conflicts
- **Backend (3000)**: Change `PORT` in `.env`
- **Frontend (5173)**: Change port in `src/client/vite.config.js`

### Permission Issues
```bash
# Fix file permissions (Linux/macOS)
chmod +x scripts/*.js
```

## Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server/index.js --name "careerconnect-ai"

# Monitor
pm2 monit

# Logs
pm2 logs careerconnect-ai
```

### Using Docker
```bash
# Build image
docker build -t careerconnect-ai .

# Run container
docker run -p 3000:3000 --env-file .env careerconnect-ai
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_TYPE=postgresql
POSTGRES_URL=your_production_postgres_url
REDIS_URL=your_production_redis_url
GPT_OSS_API_KEY=your_production_api_key
JWT_SECRET=your_production_jwt_secret
```

## Monitoring and Logs

### Application Logs
- Backend logs: Check console output or log files
- Frontend logs: Browser developer tools
- Database logs: PostgreSQL logs

### Health Monitoring
- Health endpoint: `GET /health`
- Database status: Check connection in logs
- GPT-OSS status: Check API responses

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **Database**: Use strong passwords
4. **HTTPS**: Use SSL in production
5. **Rate Limiting**: Configure appropriate limits

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Test individual components
4. Review the troubleshooting section

## Features

### New in Version 2.0
- ✅ PostgreSQL database (replacing MongoDB)
- ✅ GPT-OSS-120B integration for job recommendations
- ✅ Enhanced resume analysis
- ✅ Improved job matching algorithms
- ✅ Better error handling and logging
- ✅ Cleaner project structure

### Key Benefits
- **Reliability**: PostgreSQL provides better data consistency
- **Performance**: Optimized queries and indexing
- **AI Integration**: Advanced job recommendations using GPT-OSS-120B
- **Scalability**: Better architecture for growth
- **Maintainability**: Cleaner code structure
