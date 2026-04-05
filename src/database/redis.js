const redis = require('redis');
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

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  // Check if Redis should be disabled
  if (process.env.DISABLE_REDIS === 'true') {
    logger.info('Redis disabled via DISABLE_REDIS environment variable');
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: false // Disable auto-reconnect
      }
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
    });

    // Single connection attempt with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);
    
    await redisClient.ping();
    logger.info('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.warn('⚠️ Redis unavailable - continuing without cache');
    if (redisClient) {
      try { await redisClient.disconnect(); } catch (_) { /* ignore disconnect error */ }
    }
    redisClient = null;
    isRedisConnected = false;
    return null;
  }
};

const redisGet = async (key) => {
  if (!isRedisConnected) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Redis GET error:', error);
    return null;
  }
};

const redisSet = async (key, value, options) => {
  if (!isRedisConnected) return false;
  try {
    await redisClient.set(key, value, options);
    return true;
  } catch (error) {
    logger.error('Redis SET error:', error);
    return false;
  }
};

const redisDel = async (key) => {
  if (!isRedisConnected) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis DEL error:', error);
    return false;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection');
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection');
  await closeRedis();
  process.exit(0);
});

module.exports = { 
  connectRedis, 
  getRedisClient, 
  closeRedis,
  redisGet,
  redisSet,
  redisDel
};
