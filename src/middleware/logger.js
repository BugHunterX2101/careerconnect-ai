const winston = require('winston');

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

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Performance logger middleware
const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Performance metric', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Error logger middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

// Security logger middleware
const securityLogger = (req, res, next) => {
  // Log potential security issues
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i
  ];
  
  const requestBody = JSON.stringify(req.body);
  const requestQuery = JSON.stringify(req.query);
  const requestParams = JSON.stringify(req.params);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestQuery) || pattern.test(requestParams)) {
      logger.warn('Potential security threat detected', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      break;
    }
  }
  
  next();
};

// API usage logger
const apiUsageLogger = (req, res, next) => {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  
  logger.info('API usage', {
    endpoint,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  next();
};

// Database query logger
const dbQueryLogger = (query, duration) => {
  logger.info('Database query', {
    query: query.sql || query,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};

// File operation logger
const fileOperationLogger = (operation, filePath, duration) => {
  logger.info('File operation', {
    operation,
    filePath,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};

// Email logger
const emailLogger = (to, subject, status, error = null) => {
  const logData = {
    to,
    subject,
    status,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    logData.error = error.message;
    logger.error('Email operation failed', logData);
  } else {
    logger.info('Email operation', logData);
  }
};

// Job queue logger
const jobQueueLogger = (jobType, jobId, status, duration = null, error = null) => {
  const logData = {
    jobType,
    jobId,
    status,
    timestamp: new Date().toISOString()
  };
  
  if (duration) {
    logData.duration = `${duration}ms`;
  }
  
  if (error) {
    logData.error = error.message;
    logger.error('Job queue operation failed', logData);
  } else {
    logger.info('Job queue operation', logData);
  }
};

// Authentication logger
const authLogger = (action, userId, status, ip, userAgent) => {
  logger.info('Authentication event', {
    action,
    userId: userId || 'anonymous',
    status,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
};

// Rate limiting logger
const rateLimitLogger = (ip, endpoint, limit, remaining) => {
  logger.info('Rate limit check', {
    ip,
    endpoint,
    limit,
    remaining,
    timestamp: new Date().toISOString()
  });
};

// Health check logger
const healthCheckLogger = (status, duration, checks) => {
  logger.info('Health check', {
    status,
    duration: `${duration}ms`,
    checks,
    timestamp: new Date().toISOString()
  });
};

// Export all logging functions
module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  errorLogger,
  securityLogger,
  apiUsageLogger,
  dbQueryLogger,
  fileOperationLogger,
  emailLogger,
  jobQueueLogger,
  authLogger,
  rateLimitLogger,
  healthCheckLogger
};
