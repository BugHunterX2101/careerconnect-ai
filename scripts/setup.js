#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up CareerConnect AI...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

// Step 1: Create environment files
log('📝 Creating environment files...', 'blue');

const backendEnvContent = `# Backend Environment Variables
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/careerconnect_ai
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=careerconnect_ai_jwt_secret_${Date.now()}
JWT_REFRESH_SECRET=careerconnect_ai_refresh_secret_${Date.now()}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Configuration (Update these with your actual credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@careerconnect.ai

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=careerconnect_ai_session_${Date.now()}

# External APIs
LINKEDIN_API_URL=https://api.linkedin.com/v2
GOOGLE_CALENDAR_API_URL=https://www.googleapis.com/calendar/v3

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info
ENABLE_METRICS=true

# ML Services
TENSORFLOW_MODEL_PATH=./ml/models
BERT_MODEL_URL=https://tfhub.dev/tensorflow/bert_en_uncased_L-12_H-768_A-12/4
`;

const frontendEnvContent = `# Frontend Environment Variables (Vite)
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=CareerConnect AI
VITE_APP_VERSION=1.0.0

# OAuth Configuration (Update these with your actual credentials)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false

# External Services
VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/auth/linkedin/callback
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
`;

// Create backend .env file
if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', backendEnvContent);
  log('✅ Created .env file for backend', 'green');
} else {
  log('⚠️  .env file already exists, skipping...', 'yellow');
}

// Create frontend .env file
const frontendEnvPath = path.join('src', 'client', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  log('✅ Created .env file for frontend', 'green');
} else {
  log('⚠️  Frontend .env file already exists, skipping...', 'yellow');
}

// Step 2: Create necessary directories
log('\n📁 Creating necessary directories...', 'blue');

const directories = [
  'uploads',
  'uploads/resumes',
  'uploads/avatars',
  'uploads/temp',
  'logs',
  'ml/models',
  'ml/data'
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✅ Created directory: ${dir}`, 'green');
  } else {
    log(`⚠️  Directory already exists: ${dir}`, 'yellow');
  }
});

// Step 3: Install backend dependencies
log('\n📦 Installing backend dependencies...', 'blue');
if (runCommand('npm install')) {
  log('✅ Backend dependencies installed successfully', 'green');
} else {
  log('❌ Failed to install backend dependencies', 'red');
  process.exit(1);
}

// Step 4: Install frontend dependencies
log('\n📦 Installing frontend dependencies...', 'blue');
if (runCommand('npm install', path.join(process.cwd(), 'src', 'client'))) {
  log('✅ Frontend dependencies installed successfully', 'green');
} else {
  log('❌ Failed to install frontend dependencies', 'red');
  process.exit(1);
}

// Step 5: Create startup scripts
log('\n📜 Creating startup scripts...', 'blue');

const startScript = `#!/bin/bash
echo "🚀 Starting CareerConnect AI..."

# Start backend
echo "📡 Starting backend server..."
npm run dev &

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd src/client && npm run dev &

echo "✅ Both servers are starting..."
echo "🌐 Backend: http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo "📊 Health check: http://localhost:3000/health"

# Keep the script running
wait
`;

const startScriptPath = path.join(process.cwd(), 'start.sh');
fs.writeFileSync(startScriptPath, startScript);
fs.chmodSync(startScriptPath, '755');
log('✅ Created start.sh script', 'green');

// Step 6: Create Windows batch file
const startBatch = `@echo off
echo 🚀 Starting CareerConnect AI...

echo 📡 Starting backend server...
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd src\\client && npm run dev"

echo ✅ Both servers are starting...
echo 🌐 Backend: http://localhost:3000
echo 🎨 Frontend: http://localhost:5173
echo 📊 Health check: http://localhost:3000/health

pause
`;

const startBatchPath = path.join(process.cwd(), 'start.bat');
fs.writeFileSync(startBatchPath, startBatch);
log('✅ Created start.bat script', 'green');

// Step 7: Final instructions
log('\n🎉 Setup completed successfully!', 'green');
log('\n📋 Next steps:', 'blue');
log('1. Update OAuth credentials in .env files', 'yellow');
log('2. Start MongoDB and Redis services', 'yellow');
log('3. Run the application:', 'yellow');
log('   - Linux/Mac: ./start.sh', 'green');
log('   - Windows: start.bat', 'green');
log('   - Manual: npm run dev (backend) + cd src/client && npm run dev (frontend)', 'green');
log('\n🌐 Access the application:', 'blue');
log('   - Frontend: http://localhost:5173', 'green');
log('   - Backend API: http://localhost:3000/api', 'green');
log('   - Health Check: http://localhost:3000/health', 'green');

log('\n⚠️  Important Notes:', 'yellow');
log('- Make sure MongoDB and Redis are running', 'yellow');
log('- Update OAuth credentials before testing authentication', 'yellow');
log('- Check the README.md for detailed setup instructions', 'yellow');
