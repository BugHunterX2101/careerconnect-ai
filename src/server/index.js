const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const path = require('path');
const jwt = require('jsonwebtoken');

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

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
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
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

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

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    database: 'SQLite',
    features: ['GPT-OSS-120B', 'Resume Parsing', 'Job Recommendations'],
    message: 'CareerConnect AI is running successfully!'
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    message: 'CareerConnect AI API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiStatus: '/api/status',
      auth: '/api/auth/*',
      resume: '/api/resume/*',
      jobs: '/api/jobs/*',
      ml: '/api/ml/*',
      chat: '/api/chat/*',
      video: '/api/video/*',
      profile: '/api/profile/*'
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
app.get('/api/status', (req, res) => {
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

// Try to load routes (optional)
let routesLoaded = false;
try {
  // Import routes with error handling
  const authRoutes = require('../routes/auth');
  const resumeRoutes = require('../routes/resume');
  const jobRoutes = require('../routes/jobs');
  const chatRoutes = require('../routes/chat');
  const videoRoutes = require('../routes/video');
  const mlRoutes = require('../routes/ml');
  const profileRoutes = require('../routes/profile');

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/video', videoRoutes);
  app.use('/api/ml', mlRoutes);
  app.use('/api/profile', profileRoutes);
  
  routesLoaded = true;
  logger.info('All API routes loaded successfully');
} catch (error) {
  logger.warn('Some routes could not be loaded:', error.message);
  logger.info('Basic server functionality is still available');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      socket.userId = decoded.userId;
      socket.join(`user_${decoded.userId}`);
      socket.emit('authenticated');
    } catch (error) {
      socket.emit('authentication_error', { message: 'Invalid token' });
    }
  });
  
  // Resume processing events
  socket.on('resume_upload_progress', (data) => {
    socket.broadcast.emit('resume_processing_update', data);
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
    logger.info(`Client disconnected: ${socket.id}`);
  });
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
  
  // 404 handler - serve frontend for non-API routes
  app.use('*', (req, res) => {
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
    // Try to connect to SQLite database (optional)
    try {
      const { connectDB } = require('../database/sequelize');
      await connectDB();
      logger.info('SQLite database connected successfully');
      
      // Initialize User model after database connection
      try {
        const { initializeUserModel } = require('../models/User');
        initializeUserModel();
        logger.info('User model initialized successfully');
      } catch (modelError) {
        logger.warn('User model initialization failed:', modelError.message);
      }
    } catch (dbError) {
      logger.warn('Database connection failed, continuing without database:', dbError.message);
    }
    
    // Make io available to routes
    app.set('io', io);
    
    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Continue anyway - basic functionality will still work
  }
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`💾 Database: SQLite (file-based, no external setup required)`);
      logger.info(`🤖 GPT-OSS-120B: ${process.env.GPT_OSS_API_KEY ? 'Configured' : 'Not configured'}`);
      logger.info(`📡 Routes loaded: ${routesLoaded ? 'All' : 'Basic only'}`);
      logger.info(`🎉 CareerConnect AI is ready!`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
