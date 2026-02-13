const mongoose = require('mongoose');
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

const connectDB = async (retries = 5) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careerconnect_ai';
  
  if (!process.env.MONGODB_URI) {
    logger.warn('No MONGODB_URI provided, using local database');
  }
  
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoURI, options);
    
      logger.info('MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('All MongoDB connection attempts failed');
        if (process.env.NODE_ENV === 'production') {
          logger.warn('Continuing without database connection');
          return;
        }
        process.exit(1);
      }
    }
  }
    
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing MongoDB connection');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing MongoDB connection');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

module.exports = { connectDB };
