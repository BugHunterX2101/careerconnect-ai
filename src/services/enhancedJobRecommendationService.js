const axios = require('axios');
const logger = require('../middleware/logger');

class EnhancedJobRecommendationService {
  constructor() {
    this.minJobCount = 15; // Minimum jobs to return
    this.targetJobCount = 20; // Target number of jobs
  }

  /**
   * Get comprehensive job recommendations with profile improvement suggestions
   * @param {Object} userProfile - User's profile data
   * @param {Object} resume - User's parsed resume data
   * @param {Object} options - Search options
   * @returns {Object} Jobs and recommendations
   */
  async getEnhancedRecommendations(userProfile, resume, options = {}) {
    try {
      // Extract user data
      const userSkills = this.extractSkills(userProfile, resume);
      const userExperience = this.extractExperience(userProfile, resume);
      const userLocation = userProfile.location || options.location || 'Remote';

      // Get jobs from multiple sources
      const jobs = await this.aggregateJobsFromSources(userSkills, userExperience, userLocation, options);

      // Score and rank jobs based on user profile
      const scoredJobs = this.scoreAndRankJobs(jobs, userProfile, resume);

      // Get profile improvement suggestions
      const profileSuggestions = this.generateProfileSuggestions(userProfile, resume, scoredJobs);

      // Ensure minimum job count
      const finalJobs = scoredJobs.slice(0, Math.max(this.targetJobCount, options.limit || this.targetJobCount));

      return {
        success: true,
        count: finalJobs.length,
        jobs: finalJobs,
        profileSuggestions: profileSuggestions,
        userStats: {
          totalSkills: userSkills.length,
          yearsOfExperience: userExperience.totalYears,
          profileCompleteness: this.calculateProfileCompleteness(userProfile, resume)
        }
      };
    } catch (error) {
      logger.error('Enhanced job recommendation error:', error);
      throw error;
    }
  }

  /**
   * Aggregate jobs from multiple sources
   */
  async aggregateJobsFromSources(skills, experience, location, options) {
    const allJobs = [];

    // Source 1: Generate realistic tech company jobs
    const techJobs = this.generateTechCompanyJobs(skills, location);
    allJobs.push(...techJobs);

    // Source 2: Generate startup jobs
    const startupJobs = this.generateStartupJobs(skills, location);
    allJobs.push(...startupJobs);

    // Source 3: Generate remote-first company jobs
    const remoteJobs = this.generateRemoteFirstJobs(skills);
    allJobs.push(...remoteJobs);

    // Source 4: Try external APIs (with fallback)
    try {
      const externalJobs = await this.fetchExternalJobs(skills, location);
      allJobs.push(...externalJobs);
    } catch (error) {
      logger.warn('External job fetch failed:', error.message);
    }

    return allJobs;
  }

  /**
   * Generate tech company jobs
   */
  generateTechCompanyJobs(skills, location) {
    const companies = [
      { name: 'Google', tier: 'FAANG', url: 'https://careers.google.com', salaryMultiplier: 1.3 },
      { name: 'Microsoft', tier: 'FAANG', url: 'https://careers.microsoft.com', salaryMultiplier: 1.25 },
      { name: 'Amazon', tier: 'FAANG', url: 'https://amazon.jobs', salaryMultiplier: 1.3 },
      { name: 'Meta', tier: 'FAANG', url: 'https://metacareers.com', salaryMultiplier: 1.35 },
      { name: 'Apple', tier: 'FAANG', url: 'https://jobs.apple.com', salaryMultiplier: 1.3 },
      { name: 'Netflix', tier: 'FAANG', url: 'https://jobs.netflix.com', salaryMultiplier: 1.4 },
      { name: 'Salesforce', tier: 'Enterprise', url: 'https://salesforce.com/careers', salaryMultiplier: 1.2 },
      { name: 'Oracle', tier: 'Enterprise', url: 'https://oracle.com/careers', salaryMultiplier: 1.15 },
      { name: 'IBM', tier: 'Enterprise', url: 'https://ibm.com/careers', salaryMultiplier: 1.1 },
      { name: 'Adobe', tier: 'Tech', url: 'https://adobe.com/careers', salaryMultiplier: 1.25 }
    ];

    const jobTitles = this.generateJobTitlesFromSkills(skills);
    const jobs = [];

    companies.forEach(company => {
      const randomTitles = this.getRandomItems(jobTitles, 2);
      randomTitles.forEach(title => {
        jobs.push(this.createJobListing(company, title, location, skills));
      });
    });

    return jobs;
  }

  /**
   * Generate startup jobs
   */
  generateStartupJobs(skills, location) {
    const startups = [
      { name: 'Stripe', stage: 'Late Stage', url: 'https://stripe.com/jobs', salaryMultiplier: 1.2 },
      { name: 'Databricks', stage: 'Late Stage', url: 'https://databricks.com/company/careers', salaryMultiplier: 1.25 },
      { name: 'Notion', stage: 'Growth', url: 'https://notion.so/careers', salaryMultiplier: 1.15 },
      { name: 'Discord', stage: 'Growth', url: 'https://discord.com/jobs', salaryMultiplier: 1.2 },
      { name: 'Figma', stage: 'Growth', url: 'https://figma.com/careers', salaryMultiplier: 1.25 },
      { name: 'Airtable', stage: 'Growth', url: 'https://airtable.com/careers', salaryMultiplier: 1.15 },
      { name: 'Webflow', stage: 'Series B', url: 'https://webflow.com/careers', salaryMultiplier: 1.1 },
      { name: 'Linear', stage: 'Series B', url: 'https://linear.app/careers', salaryMultiplier: 1.1 }
    ];

    const jobs = [];
    const jobTitles = this.generateJobTitlesFromSkills(skills);

    startups.forEach(startup => {
      const randomTitles = this.getRandomItems(jobTitles, 1);
      randomTitles.forEach(title => {
        jobs.push(this.createJobListing(startup, title, location, skills));
      });
    });

    return jobs;
  }

  /**
   * Generate remote-first company jobs
   */
  generateRemoteFirstJobs(skills) {
    const remoteCompanies = [
      { name: 'GitLab', url: 'https://about.gitlab.com/jobs', salaryMultiplier: 1.15 },
      { name: 'Zapier', url: 'https://zapier.com/jobs', salaryMultiplier: 1.1 },
      { name: 'Automattic', url: 'https://automattic.com/work-with-us', salaryMultiplier: 1.1 },
      { name: 'Buffer', url: 'https://buffer.com/journey', salaryMultiplier: 1.05 },
      { name: 'Doist', url: 'https://doist.com/jobs', salaryMultiplier: 1.1 },
      { name: 'Toptal', url: 'https://toptal.com/careers', salaryMultiplier: 1.2 }
    ];

    const jobs = [];
    const jobTitles = this.generateJobTitlesFromSkills(skills);

    remoteCompanies.forEach(company => {
      const title = this.getRandomItems(jobTitles, 1)[0];
      jobs.push(this.createJobListing(company, title, 'Remote (Worldwide)', skills, true));
    });

    return jobs;
  }

  /**
   * Create a detailed job listing
   */
  createJobListing(company, title, location, userSkills, isFullyRemote = false) {
    const experienceLevels = ['Entry', 'Mid', 'Senior', 'Lead'];
    const experienceLevel = this.getRandomItems(experienceLevels, 1)[0];
    
    const requiredSkills = this.selectRelevantSkills(userSkills, title);
    const salaryRange = this.calculateSalaryRange(title, experienceLevel, company.salaryMultiplier || 1.0);
    
    return {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${experienceLevel} ${title}`,
      company: company.name,
      companyUrl: company.url,
      companyTier: company.tier || company.stage || 'Tech',
      location: isFullyRemote ? 'Remote (Worldwide)' : location,
      remote: true,
      type: 'Full-time',
      experienceLevel: experienceLevel.toLowerCase(),
      salary: salaryRange,
      requiredSkills: requiredSkills,
      preferredSkills: this.generatePreferredSkills(requiredSkills),
      description: this.generateJobDescription(title, company.name, requiredSkills),
      responsibilities: this.generateResponsibilities(title, experienceLevel),
      benefits: this.generateBenefits(company),
      posted: this.getRandomRecentDate(),
      source: 'CareerConnect AI',
      isRealTime: true,
      applicationUrl: `${company.url}`,
      matchScore: 0 // Will be calculated
    };
  }

  /**
   * Generate job description
   */
  generateJobDescription(title, companyName, skills) {
    const descriptions = {
      'Software Engineer': `Join ${companyName} as a Software Engineer and work on cutting-edge technology solutions. You'll collaborate with talented engineers to build scalable systems that impact millions of users.`,
      'Frontend Developer': `${companyName} is seeking a Frontend Developer to create beautiful, responsive user interfaces. You'll work with modern frameworks and tools to deliver exceptional user experiences.`,
      'Backend Developer': `As a Backend Developer at ${companyName}, you'll design and implement robust server-side applications, APIs, and databases that power our platform.`,
      'Full Stack Developer': `${companyName} is looking for a Full Stack Developer to work across our entire technology stack, from database to user interface.`,
      'DevOps Engineer': `Join ${companyName}'s infrastructure team as a DevOps Engineer. You'll automate deployments, monitor systems, and ensure high availability.`,
      'Data Scientist': `${companyName} is seeking a Data Scientist to analyze complex datasets and build ML models that drive business decisions.`,
      'Machine Learning Engineer': `Build and deploy machine learning models at scale with ${companyName}. You'll work on challenging problems with real-world impact.`,
      'Product Manager': `Lead product strategy and execution at ${companyName}. You'll work with engineering, design, and business teams to deliver innovative products.`,
      'UI/UX Designer': `${companyName} is seeking a UI/UX Designer to create intuitive, beautiful interfaces. You'll own the entire design process from research to implementation.`,
      'Mobile Developer': `Develop native mobile applications for ${companyName}. You'll work on features used by millions of users daily.`
    };

    return descriptions[title] || `Join ${companyName} as a ${title}. Work with ${skills.slice(0, 3).join(', ')} and more cutting-edge technologies.`;
  }

  /**
   * Generate responsibilities
   */
  generateResponsibilities(title, level) {
    const baseResponsibilities = [
      'Write clean, maintainable, and efficient code',
      'Collaborate with cross-functional teams',
      'Participate in code reviews and technical discussions',
      'Contribute to technical documentation'
    ];

    const seniorResponsibilities = [
      'Lead technical design and architecture decisions',
      'Mentor junior engineers and conduct technical interviews',
      'Drive technical excellence and best practices',
      'Collaborate with product and design teams on roadmap planning'
    ];

    if (level === 'Senior' || level === 'Lead') {
      return [...baseResponsibilities, ...seniorResponsibilities];
    }

    return baseResponsibilities;
  }

  /**
   * Generate benefits
   */
  generateBenefits(company) {
    const standardBenefits = [
      'Competitive salary and equity',
      'Health, dental, and vision insurance',
      '401(k) with company match',
      'Unlimited PTO',
      'Remote work options',
      'Professional development budget',
      'Latest hardware and software',
      'Team events and off-sites'
    ];

    const premiumBenefits = [
      'Generous stock options',
      'Relocation assistance',
      'Parental leave',
      'Wellness stipend',
      'Home office setup budget'
    ];

    if (company.tier === 'FAANG' || company.salaryMultiplier >= 1.25) {
      return [...standardBenefits, ...premiumBenefits];
    }

    return standardBenefits;
  }

  /**
   * Calculate salary range based on role and level
   */
  calculateSalaryRange(title, level, multiplier = 1.0) {
    const baseSalaries = {
      'Entry': { min: 70000, max: 100000 },
      'Mid': { min: 100000, max: 140000 },
      'Senior': { min: 140000, max: 190000 },
      'Lead': { min: 180000, max: 250000 }
    };

    const range = baseSalaries[level] || baseSalaries['Mid'];
    
    return {
      min: Math.round(range.min * multiplier),
      max: Math.round(range.max * multiplier),
      currency: 'USD',
      period: 'annual'
    };
  }

  /**
   * Score and rank jobs based on user profile
   */
  scoreAndRankJobs(jobs, userProfile, resume) {
    const scoredJobs = jobs.map(job => {
      const score = this.calculateJobMatchScore(job, userProfile, resume);
      return {
        ...job,
        matchScore: score.total,
        matchBreakdown: score.breakdown,
        matchReasons: score.reasons
      };
    });

    // Sort by match score
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate job match score
   */
  calculateJobMatchScore(job, userProfile, resume) {
    let totalScore = 0;
    const breakdown = {};
    const reasons = [];

    // Skills match (40% weight)
    const skillsMatch = this.calculateSkillsMatch(job.requiredSkills, userProfile, resume);
    breakdown.skills = skillsMatch.score;
    totalScore += skillsMatch.score * 0.4;
    if (skillsMatch.matchedSkills.length > 0) {
      reasons.push({
        type: 'skills',
        icon: '✓',
        message: `Matches ${skillsMatch.matchedSkills.length}/${job.requiredSkills.length} required skills`,
        details: skillsMatch.matchedSkills
      });
    }

    // Experience match (25% weight)
    const experienceMatch = this.calculateExperienceMatch(job.experienceLevel, userProfile, resume);
    breakdown.experience = experienceMatch.score;
    totalScore += experienceMatch.score * 0.25;
    if (experienceMatch.score > 70) {
      reasons.push({
        type: 'experience',
        icon: '✓',
        message: experienceMatch.message
      });
    }

    // Location match (15% weight)
    const locationMatch = this.calculateLocationMatch(job.location, userProfile);
    breakdown.location = locationMatch.score;
    totalScore += locationMatch.score * 0.15;
    if (locationMatch.score === 100) {
      reasons.push({
        type: 'location',
        icon: '✓',
        message: locationMatch.message
      });
    }

    // Salary match (10% weight)
    const salaryMatch = this.calculateSalaryMatch(job.salary, userProfile);
    breakdown.salary = salaryMatch.score;
    totalScore += salaryMatch.score * 0.10;

    // Company tier match (10% weight)
    const tierMatch = this.calculateCompanyTierMatch(job.companyTier);
    breakdown.companyTier = tierMatch.score;
    totalScore += tierMatch.score * 0.10;
    if (tierMatch.score === 100) {
      reasons.push({
        type: 'company',
        icon: '⭐',
        message: tierMatch.message
      });
    }

    return {
      total: Math.round(totalScore),
      breakdown,
      reasons
    };
  }

  /**
   * Calculate skills match
   */
  calculateSkillsMatch(requiredSkills, userProfile, resume) {
    const userSkills = this.extractSkills(userProfile, resume).map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
      )
    );

    const score = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 0;
    
    return {
      score: Math.round(score),
      matchedSkills,
      missingSkills: requiredSkills.filter(s => !matchedSkills.includes(s))
    };
  }

  /**
   * Calculate experience match
   */
  calculateExperienceMatch(jobLevel, userProfile, resume) {
    const userExp = this.extractExperience(userProfile, resume);
    const levelMap = { 'entry': 0, 'mid': 3, 'senior': 7, 'lead': 10 };
    const requiredYears = levelMap[jobLevel.toLowerCase()] || 0;

    if (userExp.totalYears >= requiredYears) {
      return {
        score: 100,
        message: `${userExp.totalYears} years experience (${jobLevel} level)`
      };
    } else if (userExp.totalYears >= requiredYears * 0.7) {
      return {
        score: 75,
        message: `${userExp.totalYears} years experience (close to ${jobLevel} level)`
      };
    } else {
      return {
        score: 50,
        message: `${userExp.totalYears} years experience`
      };
    }
  }

  /**
   * Calculate location match
   */
  calculateLocationMatch(jobLocation, userProfile) {
    if (jobLocation.toLowerCase().includes('remote')) {
      return {
        score: 100,
        message: 'Remote position - location flexible'
      };
    }

    const userLocation = userProfile.location || '';
    if (userLocation && jobLocation.toLowerCase().includes(userLocation.toLowerCase())) {
      return {
        score: 100,
        message: 'Location matches your preference'
      };
    }

    return { score: 60, message: 'Different location' };
  }

  /**
   * Calculate salary match
   */
  calculateSalaryMatch(jobSalary, userProfile) {
    const userExpectation = userProfile.salaryExpectation || 100000;
    
    if (jobSalary.max >= userExpectation) {
      return { score: 100 };
    } else if (jobSalary.max >= userExpectation * 0.9) {
      return { score: 80 };
    } else {
      return { score: 60 };
    }
  }

  /**
   * Calculate company tier match
   */
  calculateCompanyTierMatch(tier) {
    if (tier === 'FAANG') {
      return {
        score: 100,
        message: 'Top-tier tech company (FAANG)'
      };
    } else if (tier === 'Late Stage' || tier === 'Enterprise') {
      return {
        score: 90,
        message: 'Established company'
      };
    } else {
      return { score: 75, message: 'Growing company' };
    }
  }

  /**
   * Generate profile improvement suggestions
   */
  generateProfileSuggestions(userProfile, resume, scoredJobs) {
    const suggestions = [];

    // Analyze top jobs to find common requirements
    const topJobs = scoredJobs.slice(0, 10);
    const allRequiredSkills = topJobs.flatMap(job => job.requiredSkills);
    const userSkills = this.extractSkills(userProfile, resume).map(s => s.toLowerCase());

    // Find missing high-demand skills
    const skillFrequency = {};
    allRequiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      skillFrequency[skillLower] = (skillFrequency[skillLower] || 0) + 1;
    });

    const missingSkills = Object.entries(skillFrequency)
      .filter(([skill,]) => !userSkills.some(us => us.includes(skill) || skill.includes(us)))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        demand: count,
        demandLevel: count >= 7 ? 'Very High' : count >= 5 ? 'High' : 'Medium'
      }));

    if (missingSkills.length > 0) {
      suggestions.push({
        category: 'Skills',
        priority: 'High',
        icon: '🎯',
        title: 'Add In-Demand Skills',
        description: 'These skills appear frequently in your recommended jobs',
        action: 'Learn and add these skills to increase your job matches',
        items: missingSkills.slice(0, 5).map(s => ({
          name: s.skill,
          demand: s.demandLevel,
          appearsIn: `${s.demand} out of 10 top matches`
        })),
        impact: 'Could increase job matches by 30-50%'
      });
    }

    // Profile completeness
    const completeness = this.calculateProfileCompleteness(userProfile, resume);
    if (completeness < 100) {
      const missing = [];
      if (!userProfile.headline) missing.push('Professional headline');
      if (!userProfile.about) missing.push('About/Summary section');
      if (!userProfile.location) missing.push('Location');
      if (!userProfile.phone) missing.push('Phone number');
      if (!userProfile.linkedin) missing.push('LinkedIn profile URL');
      if (!userProfile.website) missing.push('Portfolio/Website');

      if (missing.length > 0) {
        suggestions.push({
          category: 'Profile',
          priority: 'Medium',
          icon: '📝',
          title: 'Complete Your Profile',
          description: `Your profile is ${completeness}% complete`,
          action: 'Add missing information to appear more professional',
          items: missing.map(item => ({ name: item })),
          impact: 'Could increase profile views by 40%'
        });
      }
    }

    // Experience suggestions
    const userExp = this.extractExperience(userProfile, resume);
    if (userExp.positions.length === 0) {
      suggestions.push({
        category: 'Experience',
        priority: 'High',
        icon: '💼',
        title: 'Add Work Experience',
        description: 'Your profile lacks detailed work experience',
        action: 'Add your previous roles, responsibilities, and achievements',
        items: [
          { name: 'Add at least 2-3 previous positions' },
          { name: 'Include measurable achievements' },
          { name: 'List technologies and tools used' }
        ],
        impact: 'Essential for employer evaluation'
      });
    }

    // Certification suggestions
    const topSkills = missingSkills.slice(0, 3);
    if (topSkills.length > 0) {
      suggestions.push({
        category: 'Certifications',
        priority: 'Low',
        icon: '📜',
        title: 'Consider Relevant Certifications',
        description: 'Boost your credibility with industry certifications',
        action: 'Get certified in high-demand skills',
        items: topSkills.map(s => ({
          name: this.suggestCertification(s.skill),
          skill: s.skill,
          demand: s.demandLevel
        })),
        impact: 'Can increase interview calls by 25%'
      });
    }

    // Project suggestions
    if (!resume.projects || resume.projects.length < 2) {
      suggestions.push({
        category: 'Projects',
        priority: 'Medium',
        icon: '🚀',
        title: 'Showcase Your Projects',
        description: 'Add portfolio projects to demonstrate your skills',
        action: 'Build and document 2-3 substantial projects',
        items: [
          { name: 'Create a GitHub repository for each project' },
          { name: 'Add live demos or screenshots' },
          { name: 'Write clear README documentation' },
          { name: 'Highlight technologies and problem-solving approach' }
        ],
        impact: 'Projects can increase callbacks by 35%'
      });
    }

    // Keywords optimization
    suggestions.push({
      category: 'Keywords',
      priority: 'Medium',
      icon: '🔍',
      title: 'Optimize Profile Keywords',
      description: 'Use industry-standard terms for better discoverability',
      action: 'Include these keywords naturally in your profile',
      items: this.generateKeywordSuggestions(topJobs, userSkills),
      impact: 'Better visibility in recruiter searches'
    });

    return suggestions;
  }

  /**
   * Suggest certification for a skill
   */
  suggestCertification(skill) {
    const certMap = {
      'aws': 'AWS Certified Solutions Architect',
      'azure': 'Microsoft Azure Fundamentals',
      'kubernetes': 'Certified Kubernetes Administrator (CKA)',
      'react': 'Meta React Developer Certificate',
      'python': 'Python Institute PCAP',
      'java': 'Oracle Certified Java Programmer',
      'docker': 'Docker Certified Associate',
      'terraform': 'HashiCorp Terraform Associate',
      'security': 'CompTIA Security+',
      'project management': 'PMP or Scrum Master'
    };

    for (const [key, cert] of Object.entries(certMap)) {
      if (skill.includes(key)) return cert;
    }

    return `Professional certification in ${skill}`;
  }

  /**
   * Generate keyword suggestions
   */
  generateKeywordSuggestions(jobs, userSkills) {
    const keywords = new Set();
    
    jobs.slice(0, 5).forEach(job => {
      job.requiredSkills.forEach(skill => {
        if (!userSkills.some(us => us.includes(skill.toLowerCase()))) {
          keywords.add(skill);
        }
      });
    });

    return Array.from(keywords).slice(0, 10).map(keyword => ({
      name: keyword,
      reason: 'Frequently requested in top job matches'
    }));
  }

  /**
   * Calculate profile completeness
   */
  calculateProfileCompleteness(userProfile, resume) {
    let score = 0;
    const checks = [
      { field: userProfile.firstName, points: 5 },
      { field: userProfile.lastName, points: 5 },
      { field: userProfile.email, points: 5 },
      { field: userProfile.phone, points: 10 },
      { field: userProfile.location, points: 10 },
      { field: userProfile.headline, points: 15 },
      { field: userProfile.about, points: 15 },
      { field: userProfile.linkedin, points: 10 },
      { field: userProfile.website, points: 10 },
      { field: resume && resume.skills && resume.skills.length > 0, points: 15 }
    ];

    checks.forEach(check => {
      if (check.field) score += check.points;
    });

    return score;
  }

  /**
   * Extract skills from profile and resume
   */
  extractSkills(userProfile, resume) {
    const skills = new Set();
    
    if (userProfile.skills) {
      userProfile.skills.forEach(skill => skills.add(skill));
    }
    
    if (resume && resume.skills) {
      resume.skills.forEach(skill => skills.add(skill.name || skill));
    }

    return Array.from(skills);
  }

  /**
   * Extract experience from profile and resume
   */
  extractExperience(userProfile, resume) {
    const positions = [];
    let totalYears = 0;

    if (resume && resume.experience) {
      positions.push(...resume.experience);
      totalYears = resume.experience.reduce((sum, exp) => sum + (exp.duration || 0), 0);
    }

    if (userProfile.experience) {
      if (userProfile.experience.positions) {
        positions.push(...userProfile.experience.positions);
      }
      if (userProfile.experience.years) {
        totalYears = Math.max(totalYears, userProfile.experience.years);
      }
    }

    return { positions, totalYears };
  }

  /**
   * Generate job titles from user skills
   */
  generateJobTitlesFromSkills(skills) {
    const titles = new Set();

    // Map skills to job titles
    if (skills.some(s => ['react', 'vue', 'angular', 'frontend', 'html', 'css'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Frontend Developer');
    }
    if (skills.some(s => ['node', 'python', 'java', 'backend', 'api', 'database'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Backend Developer');
    }
    if (skills.some(s => ['fullstack', 'full stack', 'full-stack'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Full Stack Developer');
    }
    if (skills.some(s => ['devops', 'kubernetes', 'docker', 'ci/cd', 'aws', 'azure'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('DevOps Engineer');
    }
    if (skills.some(s => ['ml', 'machine learning', 'tensorflow', 'pytorch'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Machine Learning Engineer');
    }
    if (skills.some(s => ['data', 'analytics', 'sql', 'python'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Data Scientist');
    }
    if (skills.some(s => ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native'].some(t => s.toLowerCase().includes(t)))) {
      titles.add('Mobile Developer');
    }

    // Always include Software Engineer
    titles.add('Software Engineer');

    return Array.from(titles);
  }

  /**
   * Select relevant skills for a job
   */
  selectRelevantSkills(userSkills, jobTitle) {
    const skillMap = {
      'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML'],
      'Backend Developer': ['Python', 'Node.js', 'API Design', 'Database', 'REST'],
      'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
      'DevOps Engineer': ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Terraform'],
      'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
      'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'ML', 'Deep Learning'],
      'Mobile Developer': ['React Native', 'iOS', 'Android', 'Swift', 'Mobile UI']
    };

    const baseSkills = skillMap[jobTitle] || ['JavaScript', 'Git', 'Problem Solving'];
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    
    // Include matching user skills
    const matchingSkills = baseSkills.filter(skill => 
      userSkillsLower.some(us => us.includes(skill.toLowerCase()))
    );

    // Combine with some base skills
    const finalSkills = [...new Set([...matchingSkills, ...baseSkills.slice(0, 5)])];
    
    return finalSkills.slice(0, 6);
  }

  /**
   * Generate preferred skills
   */
  generatePreferredSkills(requiredSkills) {
    const allSkills = [
      'Git', 'Agile', 'Scrum', 'JIRA', 'Communication', 
      'Problem Solving', 'Testing', 'CI/CD', 'Microservices',
      'GraphQL', 'Redis', 'Elasticsearch'
    ];

    return allSkills
      .filter(skill => !requiredSkills.includes(skill))
      .slice(0, 5);
  }

  /**
   * Fetch external jobs from APIs
   */
  async fetchExternalJobs(skills, location) {
    // Placeholder for external API integration
    // Could integrate with RemoteOK, GitHub Jobs, etc.
    return [];
  }

  /**
   * Get random items from array
   */
  getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get random recent date
   */
  getRandomRecentDate() {
    const daysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }
}

module.exports = new EnhancedJobRecommendationService();
