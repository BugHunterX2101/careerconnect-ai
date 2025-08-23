const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.get('/random', quizController.getRandomQuiz);
router.post('/submit', auth, quizController.submitQuizAnswer);

module.exports = router; 