const { DataTypes } = require('sequelize');
const { getSequelize } = require('../database/sequelize');

let Resume = null;

const initializeResumeModel = () => {
  if (!Resume) {
    const sequelize = getSequelize();
    Resume = sequelize.define('Resume', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      original_file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      file_type: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      processing_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'processing', 'completed', 'failed']]
        }
      },
      processing_progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      processing_error: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      personal_info: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('personal_info');
          return value ? JSON.parse(value) : {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            github: '',
            portfolio: ''
          };
        },
        set(value) {
          this.setDataValue('personal_info', JSON.stringify(value));
        }
      },
      summary: {
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
      certifications: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('certifications');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('certifications', JSON.stringify(value));
        }
      },
      languages: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('languages');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('languages', JSON.stringify(value));
        }
      },
      projects: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('projects');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('projects', JSON.stringify(value));
        }
      },
      ai_analysis: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('ai_analysis');
          return value ? JSON.parse(value) : {
            skills: [],
            experience: [],
            education: [],
            recommendations: []
          };
        },
        set(value) {
          this.setDataValue('ai_analysis', JSON.stringify(value));
        }
      },
      job_recommendations: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('job_recommendations');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('job_recommendations', JSON.stringify(value));
        }
      },
      tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('tags');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('tags', JSON.stringify(value));
        }
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('metadata');
          return value ? JSON.parse(value) : {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            processingVersion: '1.0'
          };
        },
        set(value) {
          this.setDataValue('metadata', JSON.stringify(value));
        }
      }
    }, {
      tableName: 'resumes',
      timestamps: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['processing_status']
        },
        {
          fields: ['is_active']
        }
      ]
    });

    // Instance methods
    Resume.prototype.toJSON = function() {
      const values = Object.assign({}, this.get());
      return values;
    };

    // Class methods
    Resume.findByUserId = function(userId) {
      return this.findAll({ where: { user_id: userId, is_active: true } });
    };

    Resume.findByStatus = function(status) {
      return this.findAll({ where: { processing_status: status } });
    };

    Resume.findPublic = function() {
      return this.findAll({ where: { is_public: true, is_active: true } });
    };
  }
  return Resume;
};

const getResumeModel = () => {
  if (!Resume) {
    throw new Error('Resume model not initialized. Call initializeResumeModel() first.');
  }
  return Resume;
};

module.exports = { Resume: getResumeModel, initializeResumeModel };
