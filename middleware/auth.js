const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        console.log('Auth middleware - checking token');
        
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader) {
            console.log('No authorization header found');
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        // Verify token
        const token = authHeader.split(' ')[1];
        console.log('Token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            console.log('No token found in auth header');
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            console.log('Token verified successfully, user ID:', decoded.userId);
            
            // Add user info to request
            req.user = {
                userId: decoded.userId
            };
            next();
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

module.exports = auth; 