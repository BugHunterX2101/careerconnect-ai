const express = require('express');
const router = express.Router();
const employerController = require('../controllers/employerController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, employerController.getEmployerDashboard);
router.get('/search-candidates', auth, employerController.searchCandidates);
router.put('/jobs/:jobId', auth, employerController.updateJob);

module.exports = router; 