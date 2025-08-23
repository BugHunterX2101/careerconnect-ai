const mongoose = require('mongoose');
const connectDB = require('../config/database');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Handle GET request
    if (req.method === 'GET') {
        try {
            // Try to connect if not already connected
            if (mongoose.connection.readyState !== 1) {
                await connectDB();
            }

            const dbState = mongoose.connection.readyState;
            const stateMap = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            };

            return res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: {
                    status: stateMap[dbState],
                    state: dbState,
                    name: mongoose.connection.name,
                    host: mongoose.connection.host
                },
                environment: process.env.NODE_ENV || 'development',
                config: {
                    mongodb_uri_exists: !!process.env.MONGODB_URI,
                    jwt_secret_exists: !!process.env.JWT_SECRET
                }
            });
        } catch (error) {
            console.error('Database test error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Database connection test failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Handle unsupported methods
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}; 