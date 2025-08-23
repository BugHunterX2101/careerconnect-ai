const Quiz = require('../models/Quiz');
const User = require('../models/User');

exports.getRandomQuiz = async (req, res) => {
    try {
        const { category, difficulty } = req.query;
        const query = {};
        
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;

        const quiz = await Quiz.aggregate([
            { $match: query },
            { $sample: { size: 1 } }
        ]);

        if (!quiz.length) {
            return res.status(404).json({ 
                message: 'No quiz questions found' 
            });
        }

        // Don't send correctAnswer to client
        const quizQuestion = quiz[0];
        const { correctAnswer, ...quizWithoutAnswer } = quizQuestion;

        res.json(quizWithoutAnswer);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching quiz',
            error: error.message 
        });
    }
};

exports.submitQuizAnswer = async (req, res) => {
    try {
        const { quizId, answer } = req.body;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ 
                message: 'Quiz not found' 
            });
        }

        const isCorrect = quiz.correctAnswer === answer;

        if (isCorrect && req.userId) {
            // Update user's skills if answer is correct
            await User.findByIdAndUpdate(
                req.userId,
                { $addToSet: { skills: quiz.skillType } }
            );
        }

        res.json({
            isCorrect,
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error submitting answer',
            error: error.message 
        });
    }
}; 