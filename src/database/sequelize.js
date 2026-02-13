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
      storage: databasePath,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true
      }
    });

    await sequelize.authenticate();
    logger.info('SQLite database connected successfully');
    
    // Sync database tables
    await sequelize.sync({ alter: true });
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
