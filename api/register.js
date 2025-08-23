const User = require('../models/User');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Handle POST request
    if (req.method === 'POST') {
        try {
            const { username, email, password } = req.body;
            
            // Basic validation
            if (!username || !email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Please provide username, email and password'
                });
            }

            // Create user
            const user = new User({
                username,
                email,
                password
            });

            // Save user
            await user.save();

            // Return success
            return res.status(201).json({
                status: 'success',
                message: 'Registration successful',
                data: {
                    userId: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username or email already exists'
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Registration failed'
            });
        }
    }

    // Handle unsupported methods
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}; 