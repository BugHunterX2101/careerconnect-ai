const express = require('express');
const router = express.Router();
const bertPoolManager = require('../services/bertPoolManager');
const skillGapService = require('../services/skillGapAnalysisService');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const bertLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many BERT requests, please try again later.' }
});

// Parse resume with BERT
router.post('/parse', [authenticateToken, bertLimiter], async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text required' });
    }

    const parsed = await bertPoolManager.parseResume(resumeText);
    
    res.json({
      success: true,
      data: {
        skills: parsed.skills.technical,
        experience: parsed.experience,
        education: parsed.education,
        summary: parsed.summary
      }
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// Analyze skill gaps
router.post('/skill-gaps', authenticateToken, async (req, res) => {
  try {
    const { resumeText, currentSalary } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text required' });
    }

    const analysis = await skillGapService.analyzeSkillGaps(resumeText, currentSalary);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze skill gaps' });
  }
});

// Compare resume with job
router.post('/compare-job', authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description required' });
    }

    const comparison = await skillGapService.compareWithJob(resumeText, jobDescription);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Job comparison error:', error);
    res.status(500).json({ error: 'Failed to compare with job' });
  }
});

// Get high-paying skill recommendations
router.get('/high-paying-skills', [authenticateToken, bertLimiter], async (req, res) => {
  try {
    const user = await req.user;
    const resumeText = user.resume?.text || '';
    
    if (!resumeText) {
      return res.status(400).json({ error: 'No resume found. Please upload resume first.' });
    }

    const analysis = await skillGapService.analyzeSkillGaps(resumeText, user.profile?.currentSalary);
    
    res.json({
      success: true,
      data: {
        recommendations: analysis.recommendations,
        learningPath: analysis.learningPath,
        salaryPotential: analysis.salaryPotential
      }
    });
  } catch (error) {
    console.error('High-paying skills error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Health check for BERT service
router.get('/health', async (req, res) => {
  const poolStats = bertPoolManager.getStats();
  const cacheService = require('../services/bertCacheService');
  const cacheStats = cacheService.getStats();
  
  res.json({
    success: true,
    status: poolStats.modelStatus === 'ready' ? 'operational' : 'warming',
    pool: poolStats,
    cache: cacheStats
  });
});

// Trigger non-blocking warmup of heavy model artifacts.
router.post('/warmup', [authenticateToken, bertLimiter], async (req, res) => {
  const result = await bertPoolManager.warmup();
  res.status(result.ok ? 200 : 503).json({
    success: result.ok,
    data: result
  });
});

module.exports = router;
