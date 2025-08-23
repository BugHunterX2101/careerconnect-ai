const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    // MongoDB Configuration
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/careerconnect',
    mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true,
        connectTimeoutMS: 10000,
        keepAlive: true,
        keepAliveInitialDelay: 300000
    },

    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: '24h',

    // Server Configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // CORS Configuration
    corsOrigins: [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000',
        'https://careerconnect-7af1.vercel.app',
        'https://careerconnect-client-7af1.vercel.app',
        'https://careerconnect-server-7af1.vercel.app',
        'https://careerconnect-server-7af1-vedit-agrawals-projects.vercel.app',
        'https://careerconnect-client-7af1-vedit-agrawals-projects.vercel.app'
    ],

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};

// Log configuration
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI:', config.mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('Port:', config.port);

module.exports = config;