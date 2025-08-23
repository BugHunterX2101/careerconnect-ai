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

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careerconnect_ai';
    
    if (!process.env.MONGODB_URI) {
      logger.warn('No MONGODB_URI provided, using local database');
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      retryWrites: true,
      w: 'majority',
      // Railway-specific options
      heartbeatFrequencyMS: 30000,
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing MongoDB connection');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, closing MongoDB connection');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    // For Railway, don't exit immediately, let the app continue
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Continuing without database connection in production');
      return;
    }
    process.exit(1);
  }
};

module.exports = { connectDB };
