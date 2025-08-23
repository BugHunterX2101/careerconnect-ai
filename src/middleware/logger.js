const winston = require('winston');
const { getRedisClient } = require('../database/redis');

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'careerconnect-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/requests.log' }),
    new winston.transports.File({ filename: 'logs/performance.log', level: 'info' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
      userId: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Log performance metrics for slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        userId: req.user?.id || 'anonymous'
      });
    }

    // Track API metrics
    trackAPIMetrics(req, res, duration);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Track API metrics
const trackAPIMetrics = async (req, res, duration) => {
  try {
    const redisClient = getRedisClient();
    const timestamp = Math.floor(Date.now() / 60000) * 60000; // Round to minute
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // Increment request count
    const requestKey = `api:requests:${timestamp}:${endpoint}`;
    await redisClient.incr(requestKey);
    await redisClient.expire(requestKey, 3600); // Expire after 1 hour

    // Track response times
    const responseTimeKey = `api:response_time:${timestamp}:${endpoint}`;
    await redisClient.lpush(responseTimeKey, duration);
    await redisClient.ltrim(responseTimeKey, 0, 999); // Keep last 1000 requests
    await redisClient.expire(responseTimeKey, 3600);

    // Track status codes
    const statusKey = `api:status:${timestamp}:${endpoint}:${res.statusCode}`;
    await redisClient.incr(statusKey);
    await redisClient.expire(statusKey, 3600);

    // Track user activity
    if (req.user?.id) {
      const userActivityKey = `user:activity:${req.user.id}:${timestamp}`;
      await redisClient.incr(userActivityKey);
      await redisClient.expire(userActivityKey, 86400); // Expire after 24 hours
    }

  } catch (error) {
    logger.error('Error tracking API metrics:', error);
  }
};

// Performance logger for specific operations
const performanceLogger = (operation, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  });

  return duration;
};

// Database query logger
const dbQueryLogger = (operation, query, duration, metadata = {}) => {
  logger.info('Database query', {
    operation,
    query: typeof query === 'string' ? query : JSON.stringify(query),
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  });

  // Log slow queries
  if (duration > 100) {
    logger.warn('Slow database query detected', {
      operation,
      query: typeof query === 'string' ? query : JSON.stringify(query),
      duration: `${duration}ms`,
      ...metadata
    });
  }
};

// Error logger with context
const errorLogger = (error, context = {}) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Security event logger
const securityLogger = (event, details = {}) => {
  logger.warn('Security event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Business logic logger
const businessLogger = (action, details = {}) => {
  logger.info('Business action', {
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Get API metrics
const getAPIMetrics = async (timeRange = '1h') => {
  try {
    const redisClient = getRedisClient();
    const now = Date.now();
    let startTime;

    switch (timeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (60 * 60 * 1000); // Default to 1 hour
    }

    const metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      statusCodes: {},
      topEndpoints: [],
      errors: 0
    };

    // Get request counts
    const requestPattern = 'api:requests:*';
    const requestKeys = await redisClient.keys(requestPattern);
    
    for (const key of requestKeys) {
      const parts = key.split(':');
      const timestamp = parseInt(parts[2]);
      
      if (timestamp >= startTime) {
        const count = await redisClient.get(key);
        const endpoint = parts.slice(3).join(':');
        
        metrics.totalRequests += parseInt(count) || 0;
        
        // Track top endpoints
        const existingEndpoint = metrics.topEndpoints.find(e => e.endpoint === endpoint);
        if (existingEndpoint) {
          existingEndpoint.count += parseInt(count) || 0;
        } else {
          metrics.topEndpoints.push({
            endpoint,
            count: parseInt(count) || 0
          });
        }
      }
    }

    // Get response times
    const responseTimePattern = 'api:response_time:*';
    const responseTimeKeys = await redisClient.keys(responseTimePattern);
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const key of responseTimeKeys) {
      const parts = key.split(':');
      const timestamp = parseInt(parts[2]);
      
      if (timestamp >= startTime) {
        const times = await redisClient.lrange(key, 0, -1);
        const numericTimes = times.map(t => parseInt(t)).filter(t => !isNaN(t));
        
        totalResponseTime += numericTimes.reduce((sum, time) => sum + time, 0);
        responseTimeCount += numericTimes.length;
      }
    }

    if (responseTimeCount > 0) {
      metrics.averageResponseTime = Math.round(totalResponseTime / responseTimeCount);
    }

    // Get status codes
    const statusPattern = 'api:status:*';
    const statusKeys = await redisClient.keys(statusPattern);
    
    for (const key of statusKeys) {
      const parts = key.split(':');
      const timestamp = parseInt(parts[2]);
      
      if (timestamp >= startTime) {
        const statusCode = parts[4];
        const count = await redisClient.get(key);
        
        metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + (parseInt(count) || 0);
        
        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
          metrics.errors += parseInt(count) || 0;
        }
      }
    }

    // Sort top endpoints
    metrics.topEndpoints.sort((a, b) => b.count - a.count);
    metrics.topEndpoints = metrics.topEndpoints.slice(0, 10);

    return metrics;
  } catch (error) {
    logger.error('Error getting API metrics:', error);
    return null;
  }
};

// Clean up old metrics
const cleanupOldMetrics = async () => {
  try {
    const redisClient = getRedisClient();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const patterns = [
      'api:requests:*',
      'api:response_time:*',
      'api:status:*',
      'user:activity:*'
    ];

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      
      for (const key of keys) {
        const parts = key.split(':');
        const timestamp = parseInt(parts[2]);
        
        if (timestamp < oneDayAgo) {
          await redisClient.del(key);
        }
      }
    }

    logger.info('Cleaned up old metrics');
  } catch (error) {
    logger.error('Error cleaning up old metrics:', error);
  }
};

// Schedule cleanup every hour
setInterval(cleanupOldMetrics, 60 * 60 * 1000);

module.exports = {
  requestLogger,
  performanceLogger,
  dbQueryLogger,
  errorLogger,
  securityLogger,
  businessLogger,
  getAPIMetrics,
  cleanupOldMetrics
};
