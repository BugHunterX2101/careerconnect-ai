const cors = require('cors');

// List of allowed origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
    'https://careerconnect-7af1.vercel.app',
    'https://careerconnect-client-7af1.vercel.app',
    'https://careerconnect-server-7af1.vercel.app',
    'https://careerconnect-server-7af1-vedit-agrawals-projects.vercel.app',
    'https://careerconnect-client-7af1-vedit-agrawals-projects.vercel.app'
];

// Debug middleware
const debugCors = (req, res, next) => {
    console.log('[CORS] Request from origin:', req.headers.origin || 'no origin');
    next();
};

// CORS options
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('[CORS] No origin - allowing request');
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            console.log(`[CORS] Origin ${origin} is allowed`);
            callback(null, true);
        } else {
            console.log(`[CORS] Origin ${origin} is blocked`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Additional headers middleware
const additionalHeaders = (req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('[CORS] Development mode - setting Access-Control-Allow-Origin: *');
        res.header('Access-Control-Allow-Origin', '*');
    }
    // In production, only allow specific origins
    else if (origin && allowedOrigins.includes(origin)) {
        console.log(`[CORS] Production mode - setting Access-Control-Allow-Origin: ${origin}`);
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Vary', 'Origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('[CORS] Handling OPTIONS preflight request');
        return res.status(200).end();
    }

    next();
};

module.exports = {
    corsMiddleware,
    additionalHeaders,
    debugCors,
    allowedOrigins
};

