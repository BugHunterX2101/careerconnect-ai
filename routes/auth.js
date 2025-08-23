const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);

        const { username, email, password, role = 'jobseeker' } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            console.log('Missing required fields:', { username: !!username, email: !!email, password: !!password });
            return res.status(400).json({
                status: 'error',
                message: 'Please provide username, email and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            role
        });

        // Save user
        await user.save();
        console.log('User created successfully:', { email, role });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return success with token
        return res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);

        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            console.log('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password for:', email);
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful:', { email, role: user.role });

        // Send response
        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred during login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 