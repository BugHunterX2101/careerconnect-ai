const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ 
                status: 'error',
                message: 'No token, authorization denied' 
            });
        }

        // Extract token
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({ 
                status: 'error',
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log('Token decoded:', { userId: decoded.user?.id, role: decoded.user?.role });

        if (!decoded.user || !decoded.user.id) {
            throw new Error('Invalid token structure');
        }
        
        // Set user info in request
        req.user = {
            id: decoded.user.id,
            role: decoded.user.role
        };
        
        console.log('User set in request:', req.user);
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                status: 'error',
                message: 'Token has expired' 
            });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                status: 'error',
                message: 'Invalid token' 
            });
        }
        res.status(401).json({ 
            status: 'error',
            message: 'Token is not valid',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}; 