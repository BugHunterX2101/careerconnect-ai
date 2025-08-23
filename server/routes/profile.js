const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Get user profile
router.get('/', auth, async (req, res) => {
    try {
        console.log('Profile Route - GET request received');
        console.log('User ID from token:', req.user.id);
        
        if (!req.user || !req.user.id) {
            console.error('No user ID in request');
            return res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
        }

        let profile = await Profile.findOne({ userId: req.user.id });
        console.log('Profile search result:', profile ? 'Found existing profile' : 'No profile found');
        
        if (!profile) {
            console.log('Creating new profile for user:', req.user.id);
            try {
                profile = new Profile({
                    userId: req.user.id,
                    education: [],
                    experience: [],
                    skills: [],
                    social: {
                        linkedin: '',
                        github: '',
                        portfolio: ''
                    }
                });
                await profile.save();
                console.log('New profile created successfully:', profile._id);
            } catch (saveError) {
                console.error('Error saving new profile:', saveError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to create profile'
                });
            }
        }
        
        return res.json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Profile route error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error while fetching profile'
        });
    }
});

// Add education
router.post('/education', auth, async (req, res) => {
    try {
        const { school, degree, field, startDate, endDate } = req.body;
        
        // Validate required fields
        if (!school || !degree || !field || !startDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found'
            });
        }

        profile.education.push({
            school,
            degree,
            field,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null
        });

        await profile.save();

        return res.json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Error adding education:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error while adding education'
        });
    }
});

// Add experience
router.post('/experience', auth, async (req, res) => {
    try {
        const { company, position, level, description, startDate, endDate } = req.body;
        
        // Validate required fields
        if (!company || !position || !startDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found'
            });
        }

        profile.experience.push({
            company,
            position,
            level: level || '',
            description: description || '',
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null
        });

        await profile.save();

        return res.json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Error adding experience:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error while adding experience'
        });
    }
});

// Add skill
router.post('/skills', auth, async (req, res) => {
    try {
        const { name } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Skill name is required'
            });
        }

        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found'
            });
        }

        // Check if skill already exists
        if (!profile.skills.includes(name)) {
            profile.skills.push(name);
            await profile.save();
        }

        return res.json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Error adding skill:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error while adding skill'
        });
    }
});

// Update social links
router.put('/social', auth, async (req, res) => {
    try {
        const { linkedin, github, portfolio } = req.body;
        
        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found'
            });
        }

        profile.social = {
            linkedin: linkedin || '',
            github: github || '',
            portfolio: portfolio || ''
        };

        await profile.save();

        return res.json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Error updating social links:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error while updating social links'
        });
    }
});

module.exports = router; 