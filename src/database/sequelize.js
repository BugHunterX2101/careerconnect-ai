const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize = null;
let logger = null;

// Create logger instance when needed
const initLogger = () => {
  if (!logger) {
    const winston = require('winston');
    logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.simple()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} ${level}: ${message}`;
            })
          )
        })
      ]
    });
  }
};

const connectDB = async () => {
  try {
    initLogger();
    const databasePath = path.join(__dirname, '../../database.sqlite');
    console.log('Database path:', databasePath);
    
    sequelize = new Sequelize({
      dialect: 'sqlite',
      dialectModule: require('./sqljs-shim'),
      storage: databasePath,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true
      }
    });

    await sequelize.authenticate();
    logger.info('SQLite database connected successfully');

    // Initialize ALL models before syncing so every table gets created
    try { require('../models/User').initializeUserModel(); } catch(_) {}
    try { require('../models/Resume').initializeResumeModel(); } catch(_) {}
    try { require('../models/Job').initializeJobModel(); } catch(_) {}
    try { require('../models/Conversation').initializeConversationModel(); } catch(_) {}
    try { require('../models/Message').initializeMessageModel(); } catch(_) {}
    try { require('../models/Interview').initializeInterviewModel(); } catch(_) {}

    // Use force:false (safe default) — tables are created if missing, not altered.
    // This eliminates the expensive backup/restore cycle on every startup.
    // Run with ALTER_DB=true env var to apply schema changes during development.
    const syncOptions = process.env.ALTER_DB === 'true'
      ? { alter: true }
      : {};
    await sequelize.sync(syncOptions);
    logger.info('Database tables synchronized');
    
    logger.info('Database connection and sync completed');
    
    return sequelize;
  } catch (error) {
    if (logger) {
      logger.error('Database connection failed:', error);
    }
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
