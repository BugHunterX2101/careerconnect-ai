// Load environment variables first
require('dotenv').config();

// Validate environment variables
const { validateEnvironment } = require('../config/validateEnv');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { securityHeaders } = require('../middleware/security');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'careerconnect-ai' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const server = createServer(app);
// Passport initialization
const passport = require('passport');

// Load passport strategies immediately
try {
  require('./passport');
  console.log('✅ Passport strategies loaded');
} catch (error) {
  console.log('❌ Passport strategies failed to load:', error.message);
}

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5179",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(securityHeaders);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
const { apiLimiter: newApiLimiter, authLimiter: newAuthLimiter, uploadLimiter, mlLimiter } = require('../middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/resume/upload', uploadLimiter);
app.use('/api/ml/', mlLimiter);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../public')));

// Health check endpoint (public for monitoring)
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {}
  };

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.services.mongodb = 'connected';
    } else {
      health.services.mongodb = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Root endpoint with API information (add basic rate limiting)
app.get('/', apiLimiter, (req, res) => {
  res.json({
    message: 'CareerConnect AI API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      resume: '/api/resume/*',
      jobs: '/api/jobs/*',
      ml: '/api/ml/*',
      chat: '/api/chat/*',
      video: '/api/video/*',
      profile: '/api/profile/*',
      employer: '/api/employer/*',
      employee: '/api/employee/*'
    },
    features: {
      gptOss: !!process.env.GPT_OSS_API_KEY,
      database: 'SQLite (ready)',
      realtime: 'Socket.IO (ready)',
      bert: 'Available (basic parsing)',
      linkedin: 'Configured',
      googleMeet: 'Configured'
    },
    documentation: 'API endpoints require authentication via JWT tokens'
  });
});

// Basic API routes (without database dependencies)
app.get('/api/status', [apiLimiter, passport.authenticate('jwt', { session: false })], (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    features: {
      gptOss: !!process.env.GPT_OSS_API_KEY,
      database: 'SQLite (ready)',
      realtime: 'Socket.IO (ready)'
    }
  });
});

// Load routes immediately - don't wait for database
let routesLoaded = false;
const routeMappings = [
  { path: '/api/test', module: '../routes/test' },
  { path: '/api/auth', module: '../routes/auth' },
  { path: '/api/resume', module: '../routes/resume' },
  { path: '/api/jobs', module: '../routes/jobs' },
  { path: '/api/gpt-jobs', module: '../routes/gpt-jobs' },
  { path: '/api/linkedin-jobs', module: '../routes/linkedin-jobs' },
  { path: '/api/chat', module: '../routes/chat' },
  { path: '/api/video', module: '../routes/video' },
  { path: '/api/ml', module: '../routes/ml' },
  { path: '/api/profile', module: '../routes/profile' },
  { path: '/api/employer', module: '../routes/employer' },
  { path: '/api/employee', module: '../routes/employee' },
];

function loadRoutes() {
  let loadedCount = 0;
  for (const { path: mountPath, module } of routeMappings) {
    try {
      const router = require(module);
      app.use(mountPath, router);
      loadedCount++;
      logger.info(`✓ Route loaded: ${mountPath}`);
    } catch (err) {
      logger.warn(`✗ Route load failed for ${mountPath}: ${err.message}`);
    }
  }
  routesLoaded = loadedCount > 0;
  logger.info(`Routes loaded: ${loadedCount}/${routeMappings.length}`);
}

// Load routes immediately
loadRoutes();

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  let authenticated = false;
  
  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.userId;
      socket.join(`user_${decoded.userId}`);
      authenticated = true;
      socket.emit('authenticated');
      registerSocketEvents(socket);
    } catch (error) {
      socket.emit('authentication_error', { message: 'Invalid token' });
      socket.disconnect();
      return;
    }
  });

  // Disconnect unauthorized clients after a timeout
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      socket.emit('authentication_error', { message: 'Authentication timeout' });
      socket.disconnect();
    }
  }, 5000);

  socket.on('disconnect', () => {
    clearTimeout(authTimeout);
  });

  function registerSocketEvents(socket) {
    socket.on('resume_upload_progress', (data) => {
        if (!authenticated) {
          socket.emit('authentication_error', { message: 'Authentication required' });
          return;
        }
        socket.broadcast.emit('resume_progress_update', data);
    });
    socket.on('job_recommendation_request', (data) => {
      if (!authenticated) {
        socket.emit('authentication_error', { message: 'Authentication required' });
        return;
      }
      socket.broadcast.emit('job_recommendations_ready', data);
    });
  
    socket.on('job_recommendation_request', (data) => {
      socket.broadcast.emit('job_recommendations_ready', data);
    });
  
    // Chat events
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });
    
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });
  
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });
  
  // Video call events
  socket.on('join_video_call', (interviewId) => {
    socket.join(`video_call_${interviewId}`);
  });
  
  socket.on('leave_video_call', (interviewId) => {
    socket.leave(`video_call_${interviewId}`);
  });
  
  socket.on('video_offer', (data) => {
    socket.to(`video_call_${data.interviewId}`).emit('video_offer', {
      offer: data.offer,
      from: socket.userId
    });
  });
  
  socket.on('video_answer', (data) => {
    socket.to(`video_call_${data.interviewId}`).emit('video_answer', {
      answer: data.answer,
      from: socket.userId
    });
  });
  
  socket.on('ice_candidate', (data) => {
    socket.to(`video_call_${data.interviewId}`).emit('ice_candidate', {
      candidate: data.candidate,
      from: socket.userId
    });
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${encodeURIComponent(socket.id)}`);
  });

  // Close registerSocketEvents function
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    error: {
      type: 'InternalError',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    }
  });
});

// Serve static files from the built React app
const frontendPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  
  // Authentication middleware for protected routes
  const authMiddleware = (req, res, next) => {
    // Public paths that don't require authentication
    const publicPaths = ['/login', '/register', '/about', '/'];
    if (publicPaths.includes(req.path)) {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.redirect('/login');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      jwt.verify(token, jwtSecret);
      next();
    } catch (err) {
      return res.redirect('/login');
    }
  };

  // 404 handler - serve frontend for non-API routes with auth
  app.use('*', authMiddleware, (req, res) => {
    // If it's an API route, return 404 JSON
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        availableRoutes: ['/health', '/api/status']
      });
    }
    
    // For non-API routes, serve the frontend index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Fallback if frontend is not built
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        availableRoutes: ['/health', '/api/status']
      });
    }
    
    res.status(404).json({ 
      error: 'Frontend not built',
      message: 'Please build the frontend before starting the server'
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Initialize services
async function initializeServices() {
  try {
    const strategies = passport._strategies;
    const availableStrategies = Object.keys(strategies || {});
    logger.info(`📋 Available strategies: ${availableStrategies.join(', ')}`);
    if (availableStrategies.length === 0) {
      logger.warn('⚠️ No passport strategies found');
    }
    
    try {
      const { connectDB } = require('../database/sequelize');
      await connectDB();
      logger.info('✅ SQLite database connected successfully');
    } catch (dbError) {
      logger.warn('⚠️ Database connection failed, continuing without database:', dbError.message);
      logger.info('📝 Note: Some features may be limited without database');
    }
    
    try {
      const { connectRedis } = require('../database/redis');
      await connectRedis();
    } catch (redisError) {
      logger.warn('⚠️ Redis connection failed, continuing without cache');
    }
    
    const { initFileCleanup } = require('../workers/fileCleanup');
    initFileCleanup();
    
    app.set('io', io);
    
    logger.info('✅ Services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    logger.info('🔄 Continuing with basic functionality...');
  }
}

// Start server
const PORT = parseInt(process.env.PORT, 10) || 3000;

async function startServer() {
  try {
    await initializeServices();
    
    const tryPort = (port) => {
      return new Promise((resolve, reject) => {
        const portNum = parseInt(port, 10);
        server.listen(portNum)
          .once('listening', () => resolve(portNum))
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              logger.warn(`⚠️ Port ${portNum} is in use, trying ${portNum + 1}...`);
              server.close();
              resolve(tryPort(portNum + 1));
            } else {
              reject(err);
            }
          });
      });
    };
    
    const finalPort = await tryPort(PORT);
    logger.info(`🚀 Server running on port ${finalPort}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Health check: http://localhost:${finalPort}/health`);
    logger.info(`💾 Database: SQLite (file-based, no external setup required)`);
    logger.info(`🤖 GPT-OSS-120B: ${process.env.GPT_OSS_API_KEY ? 'Configured' : 'Not configured'}`);
    logger.info(`📡 Routes loaded: ${routesLoaded ? 'All' : 'Basic only'}`);
    logger.info(`🎉 CareerConnect AI is ready!`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
