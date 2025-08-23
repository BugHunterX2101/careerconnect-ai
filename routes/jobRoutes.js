const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// Get job recommendations for logged-in user
router.get('/recommendations', auth, jobController.getJobRecommendations);

// Search jobs by skill and/or location
router.get('/search', jobController.searchJobs);

// Create new job (requires authentication)
router.post('/create', auth, jobController.createJob);

module.exports = router; 