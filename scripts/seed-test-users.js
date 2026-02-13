// Seed test users for authentication testing
const path = require('path');
const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');

// Load environment variables
require('dotenv').config();

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    // Initialize database connection
    const { connectDB } = require('../src/database/sequelize');
    const sequelize = await connectDB();
    
    console.log('✓ Database connection established\n');
    
    // Define User model directly
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(20),
        defaultValue: 'jobseeker',
        allowNull: false
      },
      company: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'Users',
      timestamps: true,
      underscored: true
    });
    
    console.log('✓ User model defined\n');
    
    // Sync the User model to create table if it doesn't exist
    await User.sync({ force: false });
    console.log('✓ User table synced\n');
    
    // Test users to create
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
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        
        if (existingUser) {
          console.log(`✓ User ${userData.email} already exists`);
          continue;
        }

        // Hash password before creating user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user with hashed password
        const user = await User.create({
          ...userData,
          password: hashedPassword
        });
        
        console.log(`✓ Created user: ${userData.email}`);
        console.log(`  - Role: ${userData.role}`);
        console.log(`  - ID: ${user.id}\n`);
      } catch (error) {
        console.error(`✗ Failed to create ${userData.email}:`, error.message);
      }
    }

    console.log('\n✓ Test user seeding complete!');
    console.log('\nTest Credentials:');
    console.log('─'.repeat(50));
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('─'.repeat(50));
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seeder
seedTestUsers();
