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
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=sqlite:./data/careerconnect.db

# External APIs
OPENAI_API_KEY=your-openai-api-key
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
CORS_ORIGIN=https://careerconnect12-production.up.railway.app
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
}

// Load environment variables
require('dotenv').config({ path: envPath });

console.log('🔧 Environment loaded');
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🚪 PORT: ${process.env.PORT || 8080}`);

// Check if frontend build exists
const frontendPath = path.join(__dirname, '../src/client/dist');
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend build found at:', frontendPath);
  console.log('📁 Frontend files:', fs.readdirSync(frontendPath));
} else {
  console.log('⚠️  Frontend build not found at:', frontendPath);
  console.log('🔍 Attempting to build frontend...');
  
  // Try to build the frontend if it doesn't exist
  const clientPackagePath = path.join(__dirname, '../src/client/package.json');
  if (fs.existsSync(clientPackagePath)) {
    console.log('📦 Client package.json found, attempting to build...');
    try {
      const { execSync } = require('child_process');
      console.log('🔨 Building frontend...');
      
      // First install client dependencies
      console.log('📥 Installing client dependencies...');
      execSync('npm install', { 
        cwd: path.join(__dirname, '../src/client'),
        stdio: 'inherit'
      });
      
      // Then build the frontend
      console.log('🔨 Building frontend...');
      execSync('npm run build', { 
        cwd: path.join(__dirname, '../src/client'),
        stdio: 'inherit'
      });
      
      console.log('✅ Frontend built successfully');
    } catch (error) {
      console.log('❌ Frontend build failed:', error.message);
      console.log('⚠️  Continuing with backend-only mode');
    }
  }
}

// Start the main server
console.log('🚀 Starting main server...');
require('../src/server/index.js');
