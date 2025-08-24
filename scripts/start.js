#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting CareerConnect AI...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '../env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
  } else {
    console.log('⚠️  No env.example found, creating basic .env...');
    const basicEnv = `# CareerConnect AI Environment Variables
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AI/ML Configuration
GPT_OSS_API_KEY=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
GPT_OSS_BASE_URL=https://api.openai.com/v1
GPT_OSS_MODEL=gpt-oss-120b

# Application Configuration
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully');
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Starting server...');
  
  const server = spawn('node', ['src/server/index.js'], { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.kill('SIGTERM');
  });
}
