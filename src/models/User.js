const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

let User = null;
let sequelize = null;

const loadDependencies = () => {
  const { getSequelize } = require('../database/sequelize');
  const { sanitizeForLog } = require('../utils/inputSanitizer');
  return { getSequelize, sanitizeForLog };
};

const initializeUserModel = () => {
  if (!User) {
    try {
      const { getSequelize } = loadDependencies();
      sequelize = getSequelize();
    } catch (error) {
      console.warn('Sequelize not available, User model cannot be initialized');
      return null;
    }
    User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [1, 50]
        }
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [1, 50]
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(20),
        defaultValue: 'jobseeker',
        allowNull: false,
        validate: {
          isIn: [['jobseeker', 'employer', 'admin']]
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      profilePicture: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('location');
          return value ? JSON.parse(value) : {
            city: '',
            state: '',
            country: '',
            timezone: ''
          };
        },
        set(value) {
          this.setDataValue('location', JSON.stringify(value));
        }
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      skills: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('skills');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('skills', JSON.stringify(value));
        }
      },
      experience: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('experience');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('experience', JSON.stringify(value));
        }
      },
      education: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('education');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('education', JSON.stringify(value));
        }
      },
      socialLinks: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('socialLinks');
          return value ? JSON.parse(value) : {
            linkedin: '',
            github: '',
            portfolio: '',
            twitter: ''
          };
        },
        set(value) {
          this.setDataValue('socialLinks', JSON.stringify(value));
        }
      },
      preferences: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('preferences');
          return value ? JSON.parse(value) : {
            jobAlerts: true,
            emailNotifications: true,
            pushNotifications: true,
            privacySettings: {
              profileVisibility: 'public',
              resumeVisibility: 'public',
              contactVisibility: 'public'
            }
          };
        },
        set(value) {
          this.setDataValue('preferences', JSON.stringify(value));
        }
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    });

    // Instance methods
    User.prototype.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    User.prototype.toJSON = function() {
      const values = Object.assign({}, this.get());
      delete values.password;
      delete values.resetPasswordToken;
      delete values.resetPasswordExpires;
      return values;
    };

    // Class methods
    User.findByEmail = function(email) {
      return this.findOne({ where: { email } });
    };

    User.findByRole = function(role) {
      return this.findAll({ where: { role } });
    };

    User.findActiveUsers = function() {
      return this.findAll({ where: { isActive: true } });
    };
  }
  return User;
};

const getUserModel = () => {
  if (!User) {
    // Try to initialize if not already done
    initializeUserModel();
  }
  if (!User) {
    throw new Error('User model not initialized. Database not available.');
  }
  return User;
};

module.exports = { User: getUserModel, initializeUserModel };
