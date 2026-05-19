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
const serviceState = {
  initializing: false,
  initialized: false,
  initError: null,
  aiWarmup: {
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    error: null
  }
};
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
  process.env.CLIENT_URL || "http://localhost:3000",
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

// Lightweight request-timing header (helps spot slow routes in DevTools)
app.use((req, _res, next) => {
  req._startAt = process.hrtime.bigint();
  next();
});

// Security middleware
app.use(securityHeaders);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://graph.linkedin.com", "https://api.github.com", "https://"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting for API endpoints
// Development: generous limits so tests / local usage never get blocked.
// Production: tighten via environment variables.
const isDev = (process.env.NODE_ENV || 'development') !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : Number(process.env.API_RATE_LIMIT_MAX || 500),
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === '/api/perf/vitals' ||
    req.path === '/perf/vitals' ||
    req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
const { uploadLimiter, mlLimiter } = require('../middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/resume/upload', uploadLimiter);
app.use('/api/ml/', mlLimiter);

// Compression — level 6 (default) balances CPU vs ratio well
app.use(compression({ level: 6, threshold: 1024 }));

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

// Uploads served with a modest cache
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// Health check endpoint (public for monitoring)
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {
      startup: serviceState.initializing
        ? 'initializing'
        : serviceState.initialized
          ? 'ready'
          : serviceState.initError
            ? 'degraded'
            : 'booting',
      aiWarmup: serviceState.aiWarmup.status
    }
  };

  const mongoRequired = process.env.MONGODB_REQUIRED === 'true';
  if (mongoRequired) {
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
  } else {
    health.services.mongodb = 'optional';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Root endpoint with API information (add basic rate limiting)
app.get('/', apiLimiter, (req, res) => {
  // Serve the React SPA for browser requests; return JSON for API clients
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  if (acceptsHtml) {
    const frontendIndex = path.join(__dirname, '../client/dist/index.html');
    if (fs.existsSync(frontendIndex)) {
      return res.sendFile(frontendIndex);
    }
  }
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
      employee: '/api/employee/*',
      bert: '/api/bert/*'
    },
    features: {
      groq: !!(process.env.GROQ_API_KEY || process.env.GPT_OSS_API_KEY),
      database: 'SQLite (ready)',
      realtime: 'Socket.IO (ready)',
      bert: 'Available (basic parsing)',
      linkedin: 'Configured',
      zoom: 'Configured'
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
      groq: !!(process.env.GROQ_API_KEY || process.env.GPT_OSS_API_KEY),
      database: 'SQLite (ready)',
      realtime: 'Socket.IO (ready)'
    }
  });
});

// Optional telemetry endpoint for client web-vitals beacons.
app.post('/api/perf/vitals', (req, res) => {
  res.status(204).end();
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
  { path: '/api/bert', module: '../routes/bertRoutes' },
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
  let eventsRegistered = false;

  const registerSocketEventsOnce = () => {
    if (eventsRegistered) return;
    eventsRegistered = true;
    registerSocketEvents(socket);
  };

  const authenticateSocket = (rawToken) => {
    if (!rawToken) return false;
    try {
      const normalizedToken = String(rawToken).replace(/^Bearer\s+/i, '');
      const jwtSecret = process.env.JWT_SECRET;
      const decoded = jwt.verify(normalizedToken, jwtSecret);
      const resolvedUserId = decoded.userId || decoded.id || decoded._id || decoded.sub;
      if (!resolvedUserId) {
        throw new Error('Missing user id in token payload');
      }

      socket.userId = resolvedUserId;
      socket.join(`user_${resolvedUserId}`);
      authenticated = true;
      socket.emit('authenticated');
      // Broadcast presence only to sockets the user is in active conversations with
      socket.broadcast.emit('user_online', { userId: resolvedUserId });
      registerSocketEventsOnce();
      return true;
    } catch (error) {
      socket.emit('authentication_error', { message: 'Invalid token' });
      return false;
    }
  };

  // Try handshake auth first (socket.io-client auth: { token }).
  const handshakeToken =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization ||
    socket.handshake?.query?.token;
  authenticateSocket(handshakeToken);

  // Keep compatibility with event-based auth.
  socket.on('authenticate', (token) => {
    if (!authenticateSocket(token)) {
      socket.disconnect();
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

  // In-video-call chat relay: forward to all peers in the same video call room
  socket.on('send_message', (data) => {
    if (!authenticated) {
      socket.emit('authentication_error', { message: 'Authentication required' });
      return;
    }
    if (data.interviewId) {
      socket.to(`video_call_${data.interviewId}`).emit('chat:new_message', {
        message: data.message
      });
    } else if (data.conversationId) {
      socket.to(`conversation_${data.conversationId}`).emit('chat:new_message', {
        conversationId: data.conversationId,
        message: data.message
      });
    }
  });

  // Message read receipt relay
  socket.on('message_read', (data) => {
    if (data.conversationId) {
      socket.to(`conversation_${data.conversationId}`).emit('message_read', {
        messageId: data.messageId,
        readBy: socket.userId
      });
    }
  });

  // Message delivered acknowledgement
  socket.on('message_delivered', (data) => {
    if (data.conversationId) {
      socket.to(`conversation_${data.conversationId}`).emit('message_delivered', {
        messageId: data.messageId,
        deliveredTo: socket.userId
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${encodeURIComponent(socket.id)}`);
    // Broadcast offline presence to everyone
    if (socket.userId) {
      io.emit('user_offline', { userId: socket.userId });
    }
  });

  // Close registerSocketEvents function
  }
});

// Error handling middleware
app.use((error, req, res, _next) => {
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
  // Vite outputs content-hashed filenames under /assets — cache aggressively
  app.use('/assets', express.static(path.join(frontendPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
    etag: false,
    lastModified: false
  }));

  // Everything else in dist (favicon, manifest, etc.) — short cache
  app.use(express.static(frontendPath, {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    index: false // prevent express.static from catching index.html for SPA routes
  }));

  // SPA fallback — no JWT verification here; the React app handles auth client-side
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        availableRoutes: ['/health', '/api/status']
      });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    }
    res.status(404).json({
      error: 'Frontend not built',
      message: 'Run: cd src/client && npm run build'
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
  serviceState.initializing = true;
  serviceState.initError = null;

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
      logger.warn('⚠️ SQLite connection failed, continuing without SQL database:', dbError.message);
    }

    try {
      const { connectDB: connectMongo } = require('../database/connection');
      await connectMongo();
      logger.info('✅ MongoDB connected successfully');
    } catch (mongoError) {
      logger.warn('⚠️ MongoDB connection failed — Job/Interview/Chat features limited:', mongoError.message);
    }
    
    try {
      const { connectRedis } = require('../database/redis');
      await connectRedis();
    } catch (redisError) {
      logger.warn('⚠️ Redis connection failed, continuing without cache');
    }

    try {
      const { setupJobQueue } = require('../workers/jobQueue');
      await setupJobQueue();
      logger.info('✅ Job queues initialized');
    } catch (queueError) {
      logger.warn('⚠️ Job queue setup failed, continuing without queues:', queueError.message);
    }

    const { initFileCleanup } = require('../workers/fileCleanup');
    initFileCleanup();
    
    app.set('io', io);

    serviceState.aiWarmup.status = 'warming';
    serviceState.aiWarmup.startedAt = new Date().toISOString();
    setImmediate(async () => {
      try {
        const bertPoolManager = require('../services/bertPoolManager');
        const warmupResult = await bertPoolManager.warmup();
        serviceState.aiWarmup.status = warmupResult.ok ? 'ready' : 'failed';
        serviceState.aiWarmup.error = warmupResult.ok ? null : warmupResult.error;
      } catch (warmupError) {
        serviceState.aiWarmup.status = 'failed';
        serviceState.aiWarmup.error = warmupError.message;
        logger.warn(`BERT warmup failed: ${warmupError.message}`);
      } finally {
        serviceState.aiWarmup.finishedAt = new Date().toISOString();
      }
    });
    
    logger.info('✅ Services initialized successfully');
    serviceState.initialized = true;
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    logger.info('🔄 Continuing with basic functionality...');
    serviceState.initError = error.message;
  } finally {
    serviceState.initializing = false;
  }
}

// Start server
const PORT = parseInt(process.env.PORT, 10) || 3000;

async function isExistingInstanceHealthy(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return Boolean(payload && payload.services && payload.services.startup);
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  try {
    const finalPort = await new Promise((resolve, reject) => {
      server.listen(PORT)
        .once('listening', () => resolve(PORT))
        .once('error', (err) => reject(err));
    });

    // Keep TCP connections alive longer to avoid per-request handshake overhead
    server.keepAliveTimeout = 65000;  // 65 s (above typical LB 60 s)
    server.headersTimeout = 70000;    // must be > keepAliveTimeout

    logger.info(`🚀 Server running on port ${finalPort}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Health check: http://localhost:${finalPort}/health`);
    logger.info(`💾 Database: SQLite (file-based, no external setup required)`);
    logger.info(`🤖 Groq LLM: ${(process.env.GROQ_API_KEY || process.env.GPT_OSS_API_KEY) ? 'Configured' : 'Not configured'}`);
    logger.info(`📡 Routes loaded: ${routesLoaded ? 'All' : 'Basic only'}`);
    logger.info(`🎉 CareerConnect AI is ready!`);

    // Warm heavy dependencies after the server is already accepting requests.
    setImmediate(() => {
      initializeServices().catch((error) => {
        logger.error('Service warmup failed:', error);
      });
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      const existingServerHealthy = await isExistingInstanceHealthy(PORT);
      if (existingServerHealthy) {
        logger.warn(`⚠️ Port ${PORT} is already in use by a healthy instance. Reusing existing server.`);
        process.exit(0);
      }

      logger.error(`❌ Port ${PORT} is already in use. OAuth callbacks expect this port, so the server cannot auto-switch.`);
      process.exit(1);
    }
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
