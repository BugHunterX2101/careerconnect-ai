const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
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

const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Validation failed',
        details: error.message
      }
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Database validation failed',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        type: 'DuplicateError',
        message: 'Resource already exists',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ForeignKeyError',
        message: 'Referenced resource not found',
        details: error.message
      }
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Invalid token'
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Token expired'
      }
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'FileUploadError',
        message: 'File upload failed',
        details: error.message
      }
    });
  }

  if (error.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: {
        type: 'FileNotFoundError',
        message: 'File not found',
        details: error.message
      }
    });
  }

  if (error.code === 'EACCES') {
    return res.status(403).json({
      success: false,
      error: {
        type: 'PermissionError',
        message: 'Permission denied',
        details: error.message
      }
    });
  }

  // Handle OpenAI API errors
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({
      success: false,
      error: {
        type: 'APIError',
        message: 'External API error',
        details: error.message
      }
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      type: 'InternalError',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.message
      })
    }
  });
};

module.exports = { errorHandler };
