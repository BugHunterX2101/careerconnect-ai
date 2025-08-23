const Job = require('../models/Job');
const User = require('../models/User');
const PriorityQueue = require('../utils/priorityQueue');

exports.getJobRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const jobs = await Job.find({}).populate('employerId', 'username');
        
        const pq = new PriorityQueue();
        
        // Calculate match score for each job
        jobs.forEach(job => {
            const matchScore = calculateMatchScore(job.requiredSkills, user.skills);
            pq.enqueue(job, matchScore);
        });
        
        // Get top 10 recommendations
        const recommendations = [];
        for (let i = 0; i < 10 && pq.values.length > 0; i++) {
            recommendations.push(pq.dequeue().job);
        }
        
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching recommendations',
            error: error.message 
        });
    }
};

exports.searchJobs = async (req, res) => {
    try {
        const { skill, location } = req.query;
        const query = {};
        
        if (skill) {
            query.requiredSkills = { $in: [skill] };
        }
        if (location) {
            query.location = new RegExp(location, 'i');
        }
        
        const jobs = await Job.find(query).populate('employerId', 'username');
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error searching jobs',
            error: error.message 
        });
    }
};

// Helper function to calculate match score
function calculateMatchScore(requiredSkills, userSkills) {
    const matchingSkills = requiredSkills.filter(skill => 
        userSkills.includes(skill)
    );
    return (matchingSkills.length / requiredSkills.length) * 100;
}

exports.createJob = async (req, res) => {
    try {
        const { title, description, requiredSkills, location, salary, experience } = req.body;
        
        const job = new Job({
            title,
            description,
            requiredSkills,
            location,
            salary,
            experience,
            employerId: req.userId
        });
        
        await job.save();
        res.status(201).json({ 
            message: 'Job created successfully',
            job 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating job',
            error: error.message 
        });
    }
}; 