// Direct database test for authentication
const bcrypt = require('bcryptjs');

async function testDirectLogin() {
  try {
    console.log('Testing direct database authentication...\n');
    
    // Initialize database
    const { connectDB } = require('../src/database/sequelize');
    const sequelize = await connectDB();
    
    // Get User model by importing and initializing
    const { User: getUserModel, initializeUserModel } = require('../src/models/User');
    
    // Try to initialize
    try {
      initializeUserModel();
      const User = getUserModel();
      
      console.log('✓ User model loaded\n');
      
      // Find test user
      const user = await User.findOne({ where: { email: 'test@test.com' } });
      
      if (!user) {
        console.log('✗ Test user not found');
        process.exit(1);
      }
      
      console.log('✓ Found user:', user.email);
      console.log('  ID:', user.id);
      console.log('  Role:', user.role);
      console.log('  HashedPassword length:', user.password.length);
      console.log('  Has comparePassword method?', typeof user.comparePassword);
      
      // Test password comparison
      if (typeof user.comparePassword === 'function') {
        const isValid = await user.comparePassword('test123');
        console.log('\n✓ Password comparison result:', isValid ? 'MATCH' : 'NO MATCH');
      } else {
        console.log('\n✗ comparePassword method not available');
        
        // Try direct bcrypt comparison
        const isValid = await bcrypt.compare('test123', user.password);
        console.log('  Direct bcrypt comparison:', isValid ? 'MATCH' : 'NO MATCH');
      }
      
    } catch (error) {
      console.error('✗ User model initialization failed:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testDirectLogin();
