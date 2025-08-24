#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting CareerConnect AI in production mode...\n');

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
NODE_ENV=production
PORT=8080
CLIENT_URL=https://careerconnect12-production.up.railway.app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AI/ML Configuration
GPT_OSS_API_KEY=your_gpt_oss_api_key_here
GPT_OSS_BASE_URL=https://api.openai.com/v1
GPT_OSS_MODEL=gpt-oss-120b

# Application Configuration
NODE_ENV=production
PORT=8080
CLIENT_URL=https://careerconnect12-production.up.railway.app
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
}

// Check if frontend is built
const frontendBuildPath = path.join(__dirname, '../src/client/dist');
if (!fs.existsSync(frontendBuildPath)) {
  console.log('🏗️ Building frontend...');
  const { execSync } = require('child_process');
  try {
    // Set Node.js memory limit and optimize build
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    
    execSync('cd src/client && npm install --production=false', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    
    execSync('cd src/client && npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    
    console.log('✅ Frontend built successfully');
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    console.log('⚠️  Continuing with backend only...');
  }
}

// Start the server
console.log('🔧 Starting production server...');
require('../src/server/index.js');
