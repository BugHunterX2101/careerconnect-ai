#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

try {
  // Create necessary directories
  const dirs = ['logs', 'uploads', 'uploads/temp', 'uploads/avatars', 'uploads/resumes'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build client
  console.log('🏗️ Building client...');
  execSync('cd src/client && npm install', { stdio: 'inherit' });
  execSync('cd src/client && npm run build', { stdio: 'inherit' });

  // Create production environment file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating production environment file...');
    const envContent = fs.readFileSync('env.production.example', 'utf8');
    fs.writeFileSync('.env', envContent);
  }

  console.log('✅ Production build completed successfully!');
  console.log('🎯 Ready for deployment on Render');

} catch (error) {
  const sanitizedMessage = error.message.replace(/[\r\n]+/g, ' ');
  console.error('❌ Build failed:', sanitizedMessage);
  process.exit(1);
}
