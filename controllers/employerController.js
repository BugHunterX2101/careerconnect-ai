const Job = require('../models/Job');
const User = require('../models/User');

exports.getEmployerDashboard = async (req, res) => {
    try {
        // Get employer's posted jobs
        const jobs = await Job.find({ employerId: req.userId })
            .sort({ createdAt: -1 });

        // Get application statistics
        const stats = await Job.aggregate([
            { $match: { employerId: req.userId } },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    averageSalary: { $avg: "$salary" }
                }
            }
        ]);

        res.json({
            jobs,
            statistics: stats[0] || { totalJobs: 0, averageSalary: 0 }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching dashboard data',
            error: error.message 
        });
    }
};

exports.searchCandidates = async (req, res) => {
    try {
        const { skills, location } = req.query;
        const query = { role: 'jobseeker' };

        if (skills) {
            const skillsArray = skills.split(',');
            query.skills = { $in: skillsArray };
        }
        if (location) {
            query.location = new RegExp(location, 'i');
        }

        const candidates = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(candidates);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error searching candidates',
            error: error.message 
        });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const updates = req.body;

        const job = await Job.findOne({ 
            _id: jobId, 
            employerId: req.userId 
        });

        if (!job) {
            return res.status(404).json({ 
                message: 'Job not found or unauthorized' 
            });
        }

        Object.assign(job, updates);
        await job.save();

        res.json({ 
            message: 'Job updated successfully',
            job 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating job',
            error: error.message 
        });
    }
}; 