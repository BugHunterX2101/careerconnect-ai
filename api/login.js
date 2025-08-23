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
            const { email, password } = req.body;

            // Basic validation
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Please provide email and password'
                });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Return success
            return res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    userId: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Login failed'
            });
        }
    }

    // Handle unsupported methods
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}; 