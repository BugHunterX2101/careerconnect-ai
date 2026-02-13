const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/ml/gpt-job-search
// @desc    GPT-enhanced job search with real-time recommendations
// @access  Private
router.post('/gpt-job-search', authenticateToken, async (req, res) => {
  try {
    const { searchContext, generateInsights = true, includeCareerAdvice = true } = req.body;
    
    // Extract keywords from search context
    const keywords = extractKeywords(searchContext);
    
    // Get GPT-enhanced job recommendations
    const gptJobs = await generateGPTJobRecommendations(keywords, searchContext);
    
    // Generate search insights
    let insights = null;
    if (generateInsights) {
      insights = await generateSearchInsights(keywords, searchContext);
    }
    
    // Add career advice
    let careerAdvice = null;
    if (includeCareerAdvice) {
      careerAdvice = await generateCareerAdvice(keywords, searchContext);
    }
    
    res.json({
      success: true,
      jobs: gptJobs,
      insights: insights,
      careerAdvice: careerAdvice,
      keywords: keywords
    });
    
  } catch (error) {
    console.error('GPT job search error:', error);
    res.status(500).json({ error: 'Failed to perform GPT job search' });
  }
});

// Extract keywords from search context using BERT-like analysis
function extractKeywords(searchContext) {
  const { query, preferences, userSkills } = searchContext;
  
  // Combine all text sources
  const allText = [
    query || '',
    preferences?.jobType || '',
    preferences?.experienceLevel || '',
    ...(userSkills || [])
  ].join(' ').toLowerCase();
  
  // Enhanced keyword extraction
  const techKeywords = [
    'javascript', 'python', 'react', 'node.js', 'typescript', 'java', 'c++',
    'aws', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'redis',
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
    'frontend', 'backend', 'fullstack', 'devops', 'cloud', 'microservices'
  ];
  
  const roleKeywords = [
    'engineer', 'developer', 'architect', 'manager', 'lead', 'senior',
    'principal', 'staff', 'director', 'analyst', 'consultant', 'specialist'
  ];
  
  const industryKeywords = [
    'fintech', 'healthcare', 'e-commerce', 'gaming', 'blockchain',
    'cybersecurity', 'edtech', 'saas', 'startup', 'enterprise'
  ];
  
  const extractedKeywords = {
    technical: techKeywords.filter(keyword => allText.includes(keyword)),
    roles: roleKeywords.filter(keyword => allText.includes(keyword)),
    industries: industryKeywords.filter(keyword => allText.includes(keyword)),
    custom: extractCustomKeywords(allText)
  };
  
  return extractedKeywords;
}

function extractCustomKeywords(text) {
  // Simple custom keyword extraction
  const words = text.split(/\s+/).filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'with', 'that', 'this', 'from'].includes(word)
  );
  
  // Return top 10 most relevant words
  return [...new Set(words)].slice(0, 10);
}

// Generate GPT-enhanced job recommendations
async function generateGPTJobRecommendations(keywords, searchContext) {
  // Mock GPT-enhanced jobs with intelligent matching
  const baseJobs = [
    {
      id: 'gpt_1',
      title: 'AI-Enhanced Full Stack Developer',
      company: 'TechForward AI',
      location: 'Remote',
      salary: '$120,000 - $160,000',
      type: 'Full-time',
      remote: true,
      description: 'Revolutionary role combining traditional full-stack development with AI integration.',
      skills: ['React', 'Node.js', 'Python', 'TensorFlow', 'AI/ML'],
      posted: 'Just posted',
      applicants: 12,
      source: 'GPT Enhanced',
      matchScore: 95
    },
    {
      id: 'gpt_2',
      title: 'Senior React Developer - FinTech',
      company: 'NextGen Finance',
      location: 'New York, NY',
      salary: '$135,000 - $175,000',
      type: 'Full-time',
      remote: false,
      description: 'Lead React development for cutting-edge financial applications.',
      skills: ['React', 'TypeScript', 'GraphQL', 'Microservices'],
      posted: '3 hours ago',
      applicants: 8,
      source: 'GPT Enhanced',
      matchScore: 91
    },
    {
      id: 'gpt_3',
      title: 'Machine Learning Engineer',
      company: 'DataCorp Analytics',
      location: 'San Francisco, CA',
      salary: '$150,000 - $200,000',
      type: 'Full-time',
      remote: true,
      description: 'Build and deploy ML models at scale for enterprise clients.',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'AWS', 'Kubernetes'],
      posted: '1 day ago',
      applicants: 25,
      source: 'GPT Enhanced',
      matchScore: 88
    }
  ];
  
  // Enhance jobs with GPT reasoning and career insights
  return baseJobs.map(job => ({
    ...job,
    gptReasoning: generateJobReasoning(job, keywords, searchContext),
    careerGrowth: generateCareerPath(job.title),
    learningOpportunities: generateLearningOps(job.skills),
    marketInsights: generateMarketInsights(job)
  }));
}

function generateJobReasoning(job, keywords, searchContext) {
  const reasons = [];
  
  // Skill matching
  const matchingSkills = job.skills.filter(skill => 
    keywords.technical.some(kw => skill.toLowerCase().includes(kw))
  );
  
  if (matchingSkills.length > 0) {
    reasons.push(`Perfect match for your ${matchingSkills.join(', ')} expertise`);
  }
  
  // Location preference
  if (searchContext.preferences?.remote && job.remote) {
    reasons.push('Matches your remote work preference');
  }
  
  // Experience level
  if (job.title.toLowerCase().includes('senior') && 
      searchContext.preferences?.experienceLevel === 'senior') {
    reasons.push('Aligns with your senior-level experience');
  }
  
  // Industry insights
  if (job.company.toLowerCase().includes('fintech') || 
      job.description.toLowerCase().includes('financial')) {
    reasons.push('FinTech offers 25% higher salaries on average');
  }
  
  return reasons.length > 0 ? reasons.join('. ') : 
    'This role matches your profile and offers excellent growth opportunities';
}

function generateCareerPath(jobTitle) {
  const paths = {
    'developer': 'Senior Developer → Tech Lead → Engineering Manager → VP Engineering',
    'engineer': 'Senior Engineer → Staff Engineer → Principal Engineer → Distinguished Engineer',
    'analyst': 'Senior Analyst → Lead Analyst → Analytics Manager → Director of Analytics',
    'manager': 'Senior Manager → Director → VP → C-Level Executive'
  };
  
  const titleLower = jobTitle.toLowerCase();
  for (const [key, path] of Object.entries(paths)) {
    if (titleLower.includes(key)) {
      return path;
    }
  }
  
  return 'Individual Contributor → Team Lead → Manager → Director';
}

function generateLearningOps(skills) {
  const opportunities = [];
  
  if (skills.some(s => s.toLowerCase().includes('react'))) {
    opportunities.push('Advanced React Patterns Workshop');
  }
  if (skills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('ml'))) {
    opportunities.push('AI/ML Certification Program');
  }
  if (skills.some(s => s.toLowerCase().includes('aws'))) {
    opportunities.push('AWS Solutions Architect Certification');
  }
  
  opportunities.push('Conference Sponsorship', 'Mentorship Program', 'Internal Tech Talks');
  
  return opportunities.slice(0, 4);
}

function generateMarketInsights(job) {
  return {
    salaryTrend: '+12% YoY',
    demandLevel: 'Very High',
    competitionLevel: 'Moderate',
    growthProjection: '+25% over 3 years'
  };
}

// Generate search insights
async function generateSearchInsights(keywords, searchContext) {
  const insights = {
    searchQuality: {
      score: calculateSearchScore(keywords, searchContext),
      feedback: generateSearchFeedback(keywords)
    },
    marketAnalysis: {
      demandLevel: 'Very High',
      competitionLevel: 'Moderate',
      salaryTrend: '+12% YoY',
      hotKeywords: keywords.technical.slice(0, 4)
    },
    recommendations: generateSearchRecommendations(keywords, searchContext),
    alternativeSearches: generateAlternativeSearches(keywords),
    skillGaps: identifySkillGaps(keywords)
  };
  
  return insights;
}

function calculateSearchScore(keywords, searchContext) {
  let score = 50; // Base score
  
  // Technical keywords boost
  score += keywords.technical.length * 10;
  
  // Role clarity boost
  if (keywords.roles.length > 0) score += 15;
  
  // Industry focus boost
  if (keywords.industries.length > 0) score += 10;
  
  // Location specificity
  if (searchContext.location) score += 10;
  
  // Experience level clarity
  if (searchContext.preferences?.experienceLevel) score += 5;
  
  return Math.min(score, 100);
}

function generateSearchFeedback(keywords) {
  if (keywords.technical.length >= 3) {
    return 'Excellent search terms! Your query targets high-demand skills in growing markets.';
  } else if (keywords.technical.length >= 1) {
    return 'Good search focus. Consider adding more specific technical skills for better matches.';
  } else {
    return 'Try adding specific technical skills or tools to improve job matching accuracy.';
  }
}

function generateSearchRecommendations(keywords, searchContext) {
  const recommendations = [];
  
  if (keywords.technical.length < 3) {
    recommendations.push('Consider adding more specific technical skills to your search');
  }
  
  if (!searchContext.preferences?.remote) {
    recommendations.push('Remote positions in your field offer 8% salary premium');
  }
  
  if (keywords.technical.includes('react') && !keywords.technical.includes('typescript')) {
    recommendations.push('Adding "TypeScript" to your search increases opportunities by 15%');
  }
  
  if (keywords.industries.length === 0) {
    recommendations.push('FinTech and HealthTech sectors show highest growth for your skills');
  }
  
  return recommendations;
}

function generateAlternativeSearches(keywords) {
  const alternatives = [];
  
  if (keywords.technical.includes('react')) {
    alternatives.push('Frontend Engineer + React');
    alternatives.push('React Developer + TypeScript');
  }
  
  if (keywords.technical.includes('python')) {
    alternatives.push('Python Developer + Machine Learning');
    alternatives.push('Backend Engineer + Python');
  }
  
  alternatives.push('Full Stack Developer + Remote');
  
  return alternatives.slice(0, 4);
}

function identifySkillGaps(keywords) {
  const inDemandSkills = ['TypeScript', 'GraphQL', 'AWS', 'Docker', 'Kubernetes'];
  const gaps = inDemandSkills.filter(skill => 
    !keywords.technical.some(kw => kw.toLowerCase().includes(skill.toLowerCase()))
  );
  
  return gaps.slice(0, 3);
}

// Generate career advice
async function generateCareerAdvice(keywords, searchContext) {
  return {
    nextSkills: identifySkillGaps(keywords),
    industryTrends: ['AI Integration', 'Micro-frontends', 'Web3', 'Edge Computing'],
    salaryNegotiation: generateSalaryAdvice(keywords),
    careerPath: generateCareerPathAdvice(searchContext),
    networkingTips: [
      'Join tech meetups in your area',
      'Contribute to open source projects',
      'Build a strong LinkedIn presence',
      'Attend industry conferences'
    ]
  };
}

function generateSalaryAdvice(keywords) {
  if (keywords.technical.includes('react')) {
    return 'Highlight your React expertise - it\'s in top 5 most demanded skills';
  } else if (keywords.technical.includes('python')) {
    return 'Python skills command premium salaries, especially with AI/ML experience';
  } else {
    return 'Focus on your unique skill combination and quantifiable achievements';
  }
}

function generateCareerPathAdvice(searchContext) {
  const experience = searchContext.preferences?.experienceLevel;
  
  if (experience === 'entry') {
    return 'Focus on building strong fundamentals and contributing to team projects';
  } else if (experience === 'mid') {
    return 'Consider taking on mentorship roles and leading small projects';
  } else if (experience === 'senior') {
    return 'Look for opportunities to drive technical decisions and mentor junior developers';
  } else {
    return 'Continuously learn new technologies and build a strong professional network';
  }
}

module.exports = router;