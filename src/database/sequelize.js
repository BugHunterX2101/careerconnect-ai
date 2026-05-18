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
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      },
      // SQLite pool — allow up to 5 concurrent readers
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000
      }
    });

    await sequelize.authenticate();
    logger.info('SQLite database connected successfully');

    // Enable WAL journal mode for concurrent read/write performance
    await sequelize.query('PRAGMA journal_mode=WAL;');
    await sequelize.query('PRAGMA synchronous=NORMAL;');
    await sequelize.query('PRAGMA cache_size=-32000;'); // 32 MB page cache
    await sequelize.query('PRAGMA temp_store=MEMORY;');
    await sequelize.query('PRAGMA mmap_size=268435456;'); // 256 MB memory-mapped I/O

    // Sync only creates missing tables — never destructively alters existing ones
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    await sequelize.sync({ alter: isDev, force: false });
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
