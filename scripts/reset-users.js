// Reset Users table with correct schema
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

async function resetUsersTable() {
  console.log('Resetting Users table with correct schema...\n');
  
  try {
    // Initialize database
    const { connectDB } = require('../src/database/sequelize');
    const sequelize = await connectDB();
    
    console.log('✓ Database connected\n');
    
    // Drop existing Users table
    await sequelize.query('DROP TABLE IF EXISTS Users');
    console.log('✓ Dropped existing Users table\n');
    
    // Now let the User model create the correct schema
    const { initializeUserModel, User: getUserModel } = require('../src/models/User');
    initializeUserModel();
    const User = getUserModel();
    
    // Sync to create table with correct schema
    await User.sync({ force: true });
    console.log('✓ Created Users table with correct schema\n');
    
    // Create test users
    const testUsers = [
      {
        email: 'test@test.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        role: 'jobseeker'
      },
      {
        email: 'employer@test.com',
        password: 'employer123',
        firstName: 'Test',
        lastName: 'Employer',
        role: 'employer',
        company: 'Test Company'
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'jobseeker'
      }
    ];
    
    console.log('Creating test users...\n');
    
    for (const userData of testUsers) {
      const user = await User.create(userData);
      console.log(`✓ Created: ${userData.email} (ID: ${user.id}, Role: ${userData.role})`);
    }
    
    console.log('\n✓ All test users created successfully!\n');
    console.log('Test Credentials:');
    console.log('─'.repeat(50));
    testUsers.forEach(user => {
      console.log(`Email: ${user.email} / Password: ${user.password} / Role: ${user.role}`);
    });
    console.log('─'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetUsersTable();
