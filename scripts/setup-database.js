#!/usr/bin/env node

const { connectDB, getSequelize } = require('../src/database/sequelize');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');

console.log('🚀 Setting up CareerConnect AI Database...\n');

async function setupDatabase() {
  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    
    // Sync all models
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false, alter: true });
    
    // Create associations
    console.log('🔗 Setting up model associations...');
    User.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' });
    Resume.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Sync associations
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database setup completed successfully!');
    console.log('📋 Tables created:');
    console.log('   - users');
    console.log('   - resumes');
    console.log('   - SequelizeMeta (for migrations)');
    
    // Test connection
    console.log('\n🧪 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection test successful!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
