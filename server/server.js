const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const rateLimit = require('express-rate-limit');

// Initialize express app
const app = express();

// Set strict query for Mongoose
mongoose.set('strictQuery', true);

// Create rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting
app.use(limiter);

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || config.corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.method !== 'GET') {
        console.log('Body:', req.body);
    }
    next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    const status = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        memory: {
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        },
        uptime: `${Math.round(process.uptime())}s`
    };
    
    const httpStatus = status.mongodb.status === 'connected' ? 200 : 503;
    res.status(httpStatus).json(status);
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.status(200).json({ 
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// MongoDB connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`MongoDB connection attempt ${i + 1} of ${retries}`);
            console.log('Connecting to MongoDB URI:', config.mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
            console.log('MongoDB options:', JSON.stringify(config.mongoOptions, null, 2));
            
            await mongoose.connect(config.mongoURI, config.mongoOptions);
            
            console.log('MongoDB Connected Successfully');
            console.log('Connection state:', mongoose.connection.readyState);
            console.log('Database name:', mongoose.connection.name);
            
            // Set up connection error handlers
            mongoose.connection.on('error', err => {
                console.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
            });

            return true;
        } catch (err) {
            console.error('MongoDB connection error:', {
                message: err.message,
                code: err.code,
                name: err.name,
                stack: err.stack
            });
            
            if (i === retries - 1) {
                console.error('Max retries reached. Could not connect to MongoDB.');
                throw err;
            }
            
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
};

// Server startup with health monitoring
const startServer = async () => {
    try {
        await connectWithRetry();
        
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            console.log(`Server is listening on all network interfaces`);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                console.log('Server closed. Exiting process.');
                mongoose.connection.close(false, () => {
                    process.exit(0);
                });
            });
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    startServer().catch(err => {
        console.error('Fatal error during server startup:', err);
        process.exit(1);
    });
}

// Export for testing and Vercel
module.exports = app;

