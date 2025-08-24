const { Sequelize } = require('sequelize');
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

let sequelize = null;

const connectDB = async () => {
  try {
    // Use SQLite by default for reliability
    const databasePath = path.join(__dirname, '../../database.sqlite');
    console.log('Database path:', databasePath);
    
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: databasePath,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true
      }
    });

    await sequelize.authenticate();
    logger.info('SQLite database connected successfully');
    
    // Initialize User model
    try {
      const { initializeUserModel } = require('../models/User');
      initializeUserModel();
      logger.info('User model initialized');
    } catch (modelError) {
      logger.warn('User model initialization failed:', modelError.message);
    }
    
    // Initialize Resume model
    try {
      const { initializeResumeModel } = require('../models/Resume');
      initializeResumeModel();
      logger.info('Resume model initialized');
    } catch (modelError) {
      logger.warn('Resume model initialization failed:', modelError.message);
    }
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: true });
    logger.info('Database models synchronized');
    
    return sequelize;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return sequelize;
};

module.exports = { connectDB, getSequelize };
