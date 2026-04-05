const logger = require('../middleware/logger');

class CareerImprovementService {
  constructor() {
    this.User = null;
    this.initializeModels();
  }

  initializeModels() {
    try {
      this.User = require('../models/User');
    } catch (error) {
      console.warn('User model not available for career improvement:', error.message);
    }
  }

  // Generate GPT-powered career improvement suggestions based on BERT keywords
  async generateCareerSuggestions(userId, bertKeywords, profileData = {}) {
    try {
      const suggestions = {
        skillGaps: await this.identifySkillGaps(bertKeywords, profileData),
        careerPaths: await this.suggestCareerPaths(bertKeywords, profileData),
        learningRecommendations: await this.generateLearningPlan(bertKeywords, profileData),
        marketInsights: await this.getMarketInsights(bertKeywords),
        salaryOptimization: await this.analyzeSalaryPotential(bertKeywords, profileData),
        networkingTips: await this.generateNetworkingAdvice(bertKeywords, profileData),
        resumeEnhancements: await this.suggestResumeImprovements(bertKeywords, profileData),
        interviewPrep: await this.generateInterviewPrep(bertKeywords, profileData)
      };

      return {
        userId,
        generatedAt: new Date().toISOString(),
        bertKeywords,
        suggestions,
        overallScore: this.calculateCareerScore(bertKeywords, profileData),
        priorityActions: this.getPriorityActions(suggestions)
      };

    } catch (error) {
      logger.error('Career suggestions generation error:', error);
      throw error;
    }
  }

  // Identify skill gaps based on market demand and user's current skills
  async identifySkillGaps(bertKeywords, profileData) {
    const currentSkills = [
      ...(bertKeywords.technical || []),
      ...(bertKeywords.skills || []),
      ...(profileData.skills || [])
    ].map(skill => skill.toLowerCase());

    const marketDemandSkills = {
      'frontend': ['react', 'vue', 'angular', 'typescript', 'next.js', 'tailwind'],
      'backend': ['node.js', 'python', 'go', 'rust', 'microservices', 'graphql'],
      'cloud': ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform'],
      'data': ['python', 'sql', 'pandas', 'tensorflow', 'pytorch', 'spark'],
      'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'xamarin'],
      'devops': ['jenkins', 'gitlab ci', 'ansible', 'prometheus', 'grafana']
    };

    const skillGaps = [];
    const userRole = this.determineUserRole(bertKeywords);

    // Analyze gaps based on user's career focus
    for (const [category, skills] of Object.entries(marketDemandSkills)) {
      const missingSkills = skills.filter(skill => 
        !currentSkills.some(userSkill => userSkill.includes(skill.toLowerCase()))
      );

      if (missingSkills.length > 0) {
        skillGaps.push({
          category,
          missingSkills,
          priority: this.calculateSkillPriority(category, userRole, missingSkills),
          marketDemand: this.getMarketDemand(category),
          learningTime: this.estimateLearningTime(missingSkills),
          salaryImpact: this.estimateSalaryImpact(missingSkills)
        });
      }
    }

    return skillGaps.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  // Suggest career advancement paths
  async suggestCareerPaths(bertKeywords, profileData) {
    const currentRole = this.determineUserRole(bertKeywords);
    const experience = profileData.experience?.years || 0;

    const careerPaths = [];

    // Technical advancement paths
    if (currentRole.includes('developer') || currentRole.includes('engineer')) {
      careerPaths.push({
        path: 'Senior Technical Role',
        nextRole: `Senior ${currentRole}`,
        timeframe: '1-2 years',
        requirements: [
          'Master advanced frameworks and architectures',
          'Lead technical projects and mentor juniors',
          'Contribute to open source projects',
          'Obtain relevant certifications'
        ],
        salaryIncrease: '25-40%',
        probability: this.calculatePathProbability(bertKeywords, 'senior_tech')
      });

      careerPaths.push({
        path: 'Technical Leadership',
        nextRole: 'Tech Lead / Engineering Manager',
        timeframe: '2-3 years',
        requirements: [
          'Develop leadership and communication skills',
          'Gain experience in project management',
          'Build cross-functional collaboration skills',
          'Learn business strategy and planning'
        ],
        salaryIncrease: '40-60%',
        probability: this.calculatePathProbability(bertKeywords, 'tech_lead')
      });

      careerPaths.push({
        path: 'Specialization',
        nextRole: 'Principal Engineer / Architect',
        timeframe: '3-5 years',
        requirements: [
          'Deep expertise in specific technology domain',
          'System design and architecture skills',
          'Industry recognition and thought leadership',
          'Advanced problem-solving capabilities'
        ],
        salaryIncrease: '50-80%',
        probability: this.calculatePathProbability(bertKeywords, 'specialist')
      });
    }

    // Management paths
    if (experience >= 3) {
      careerPaths.push({
        path: 'People Management',
        nextRole: 'Engineering Manager / Director',
        timeframe: '2-4 years',
        requirements: [
          'Develop people management skills',
          'Learn hiring and performance management',
          'Understand business metrics and KPIs',
          'Build strategic thinking capabilities'
        ],
        salaryIncrease: '35-55%',
        probability: this.calculatePathProbability(bertKeywords, 'management')
      });
    }

    // Entrepreneurial paths
    careerPaths.push({
      path: 'Entrepreneurship',
      nextRole: 'Startup Founder / CTO',
      timeframe: '1-3 years',
      requirements: [
        'Develop business and product skills',
        'Build network and find co-founders',
        'Learn fundraising and investor relations',
        'Gain experience in multiple domains'
      ],
      salaryIncrease: 'Variable (high risk/reward)',
      probability: this.calculatePathProbability(bertKeywords, 'entrepreneur')
    });

    return careerPaths.sort((a, b) => b.probability - a.probability);
  }

  // Generate personalized learning recommendations
  async generateLearningPlan(bertKeywords, _profileData) {
    const currentSkills = bertKeywords.technical || [];

    const learningPlan = {
      immediate: [], // 0-3 months
      shortTerm: [], // 3-6 months
      longTerm: [], // 6-12 months
      certifications: [],
      projects: []
    };

    // Immediate learning (high-impact, quick wins)
    learningPlan.immediate.push({
      skill: 'System Design',
      reason: 'Critical for senior roles and interviews',
      resources: [
        'Designing Data-Intensive Applications book',
        'System Design Interview course',
        'Practice with LeetCode system design'
      ],
      timeCommitment: '2-3 hours/week',
      difficulty: 'intermediate'
    });

    if (!currentSkills.includes('docker')) {
      learningPlan.immediate.push({
        skill: 'Docker & Containerization',
        reason: 'Essential for modern development workflows',
        resources: [
          'Docker official tutorial',
          'Docker for Developers course',
          'Hands-on container projects'
        ],
        timeCommitment: '1-2 hours/week',
        difficulty: 'beginner'
      });
    }

    // Short-term learning (skill building)
    if (currentSkills.includes('javascript') && !currentSkills.includes('typescript')) {
      learningPlan.shortTerm.push({
        skill: 'TypeScript',
        reason: 'Improves code quality and is highly demanded',
        resources: [
          'TypeScript Handbook',
          'TypeScript Deep Dive',
          'Convert existing JS projects to TS'
        ],
        timeCommitment: '3-4 hours/week',
        difficulty: 'intermediate'
      });
    }

    learningPlan.shortTerm.push({
      skill: 'Cloud Architecture (AWS/Azure)',
      reason: 'Cloud skills are in high demand across all roles',
      resources: [
        'AWS Solutions Architect course',
        'Cloud practitioner certification',
        'Build and deploy cloud projects'
      ],
      timeCommitment: '4-5 hours/week',
      difficulty: 'intermediate'
    });

    // Long-term learning (advanced skills)
    learningPlan.longTerm.push({
      skill: 'Machine Learning & AI',
      reason: 'Future-proofing career with emerging technologies',
      resources: [
        'Andrew Ng Machine Learning Course',
        'Fast.ai practical deep learning',
        'Kaggle competitions and projects'
      ],
      timeCommitment: '5-6 hours/week',
      difficulty: 'advanced'
    });

    // Certifications
    learningPlan.certifications = [
      {
        name: 'AWS Solutions Architect',
        priority: 'high',
        timeToComplete: '2-3 months',
        salaryImpact: '$10,000-15,000',
        difficulty: 'intermediate'
      },
      {
        name: 'Google Cloud Professional',
        priority: 'medium',
        timeToComplete: '2-3 months',
        salaryImpact: '$8,000-12,000',
        difficulty: 'intermediate'
      },
      {
        name: 'Kubernetes Administrator (CKA)',
        priority: 'medium',
        timeToComplete: '3-4 months',
        salaryImpact: '$12,000-18,000',
        difficulty: 'advanced'
      }
    ];

    // Project recommendations
    learningPlan.projects = [
      {
        name: 'Full-Stack E-commerce Platform',
        skills: ['React', 'Node.js', 'Database Design', 'Payment Integration'],
        duration: '2-3 months',
        complexity: 'intermediate',
        portfolioValue: 'high'
      },
      {
        name: 'Microservices Architecture',
        skills: ['Docker', 'Kubernetes', 'API Design', 'Service Mesh'],
        duration: '3-4 months',
        complexity: 'advanced',
        portfolioValue: 'very high'
      },
      {
        name: 'Machine Learning Pipeline',
        skills: ['Python', 'TensorFlow', 'Data Processing', 'MLOps'],
        duration: '4-5 months',
        complexity: 'advanced',
        portfolioValue: 'high'
      }
    ];

    return learningPlan;
  }

  // Get market insights and trends
  async getMarketInsights(bertKeywords) {
    const userSkills = bertKeywords.technical || [];
    
    return {
      trendingSkills: [
        { skill: 'AI/ML', growth: '+45%', demand: 'very high', avgSalary: '$140,000' },
        { skill: 'Cloud Native', growth: '+38%', demand: 'high', avgSalary: '$125,000' },
        { skill: 'DevOps/SRE', growth: '+32%', demand: 'high', avgSalary: '$130,000' },
        { skill: 'Cybersecurity', growth: '+28%', demand: 'very high', avgSalary: '$135,000' },
        { skill: 'Blockchain', growth: '+25%', demand: 'medium', avgSalary: '$120,000' }
      ],
      industryGrowth: [
        { industry: 'FinTech', growth: '+42%', hiring: 'aggressive' },
        { industry: 'HealthTech', growth: '+38%', hiring: 'strong' },
        { industry: 'EdTech', growth: '+35%', hiring: 'moderate' },
        { industry: 'GreenTech', growth: '+40%', hiring: 'growing' }
      ],
      salaryTrends: {
        yourSkills: this.calculateSkillValue(userSkills),
        marketAverage: '$115,000',
        topPercentile: '$180,000',
        growthPotential: '+15-25% with skill upgrades'
      },
      remoteOpportunities: {
        percentage: '68%',
        trend: 'increasing',
        salaryImpact: '+5-10% for remote-first companies'
      }
    };
  }

  // Analyze salary optimization opportunities
  async analyzeSalaryPotential(bertKeywords, profileData) {
    const currentSkills = bertKeywords.technical || [];
    const experience = profileData.experience?.years || 0;
    const location = profileData.location || 'Remote';

    const baseSalary = this.estimateCurrentSalary(currentSkills, experience, location);
    const optimizedSalary = this.calculateOptimizedSalary(currentSkills, experience);

    return {
      currentEstimate: baseSalary,
      optimizedPotential: optimizedSalary,
      increaseOpportunity: optimizedSalary - baseSalary,
      percentageIncrease: Math.round(((optimizedSalary - baseSalary) / baseSalary) * 100),
      strategies: [
        {
          strategy: 'Skill Upgrade',
          impact: '+$15,000-25,000',
          timeframe: '6-12 months',
          effort: 'medium',
          description: 'Add high-demand skills like cloud architecture or ML'
        },
        {
          strategy: 'Role Advancement',
          impact: '+$20,000-35,000',
          timeframe: '12-18 months',
          effort: 'high',
          description: 'Move to senior or lead position with expanded responsibilities'
        },
        {
          strategy: 'Company Switch',
          impact: '+$10,000-20,000',
          timeframe: '3-6 months',
          effort: 'medium',
          description: 'Join high-paying companies or hot industries like FinTech'
        },
        {
          strategy: 'Location Optimization',
          impact: '+$5,000-15,000',
          timeframe: '1-3 months',
          effort: 'low',
          description: 'Target remote roles or relocate to high-paying markets'
        }
      ],
      negotiationTips: [
        'Research market rates using Glassdoor, Levels.fyi, and PayScale',
        'Highlight unique value proposition and recent achievements',
        'Consider total compensation including equity and benefits',
        'Time negotiations with performance reviews or job offers'
      ]
    };
  }

  // Generate networking and career advancement advice
  async generateNetworkingAdvice(bertKeywords, profileData) {
    const experience = profileData.experience?.years || 0;

    return {
      platforms: [
        {
          platform: 'LinkedIn',
          priority: 'high',
          actions: [
            'Optimize profile with relevant keywords',
            'Share technical insights and project updates',
            'Connect with industry leaders and peers',
            'Engage with posts in your technology stack'
          ],
          timeCommitment: '30 min/day'
        },
        {
          platform: 'GitHub',
          priority: 'high',
          actions: [
            'Maintain active contribution graph',
            'Contribute to popular open source projects',
            'Showcase personal projects with good documentation',
            'Follow and collaborate with industry experts'
          ],
          timeCommitment: '1-2 hours/week'
        },
        {
          platform: 'Twitter/X',
          priority: 'medium',
          actions: [
            'Follow tech leaders and share insights',
            'Participate in tech discussions and threads',
            'Share learning journey and achievements',
            'Build thought leadership in your niche'
          ],
          timeCommitment: '15-20 min/day'
        }
      ],
      events: [
        {
          type: 'Tech Conferences',
          examples: ['AWS re:Invent', 'Google I/O', 'React Conf'],
          benefit: 'Learn latest trends and network with experts',
          frequency: '2-3 per year'
        },
        {
          type: 'Local Meetups',
          examples: ['JavaScript meetups', 'DevOps groups', 'Startup events'],
          benefit: 'Build local professional network',
          frequency: '1-2 per month'
        },
        {
          type: 'Online Communities',
          examples: ['Dev.to', 'Stack Overflow', 'Discord servers'],
          benefit: 'Continuous learning and help others',
          frequency: 'Daily participation'
        }
      ],
      mentorship: {
        findMentor: [
          'Identify senior professionals in your target role',
          'Reach out with specific questions and value proposition',
          'Offer to help with their projects or initiatives',
          'Be consistent and respectful of their time'
        ],
        becomeMentor: experience >= 2 ? [
          'Mentor junior developers in your technology stack',
          'Volunteer for coding bootcamps or online platforms',
          'Create educational content and tutorials',
          'Participate in hackathons as a mentor'
        ] : []
      }
    };
  }

  // Suggest resume and profile enhancements
  async suggestResumeImprovements(bertKeywords, _profileData) {
    const currentSkills = bertKeywords.technical || [];

    return {
      keywordOptimization: {
        missing: this.getMissingKeywords(currentSkills),
        trending: ['cloud-native', 'microservices', 'AI/ML', 'DevOps', 'agile'],
        atsOptimization: [
          'Include exact job posting keywords',
          'Use standard section headers',
          'Avoid graphics and complex formatting',
          'Include relevant certifications and skills'
        ]
      },
      contentImprovements: [
        {
          section: 'Professional Summary',
          suggestion: 'Add quantifiable achievements and specific technologies',
          example: 'Senior developer with 5+ years building scalable web applications using React, Node.js, and AWS, improving system performance by 40%'
        },
        {
          section: 'Experience',
          suggestion: 'Use action verbs and quantify impact',
          example: 'Architected microservices platform serving 1M+ users, reducing response time by 60% and increasing system reliability to 99.9%'
        },
        {
          section: 'Projects',
          suggestion: 'Highlight technical complexity and business impact',
          example: 'Built real-time analytics dashboard using React, D3.js, and WebSocket, enabling data-driven decisions that increased conversion by 25%'
        }
      ],
      formatting: [
        'Use clean, ATS-friendly template',
        'Keep to 1-2 pages maximum',
        'Use consistent formatting and fonts',
        'Include links to GitHub and portfolio',
        'Ensure mobile-friendly PDF format'
      ],
      portfolioEnhancements: [
        'Create live demos of your best projects',
        'Include detailed README files with setup instructions',
        'Show code quality with tests and documentation',
        'Demonstrate full-stack capabilities',
        'Include case studies explaining your problem-solving process'
      ]
    };
  }

  // Generate interview preparation guidance
  async generateInterviewPrep(bertKeywords, profileData) {
    const currentSkills = bertKeywords.technical || [];
    const targetRole = profileData.targetRole || 'Senior Developer';

    return {
      technicalPrep: {
        codingChallenges: [
          {
            platform: 'LeetCode',
            focus: 'Data structures and algorithms',
            timeCommitment: '1 hour/day',
            difficulty: 'Medium to Hard problems'
          },
          {
            platform: 'HackerRank',
            focus: 'Domain-specific challenges',
            timeCommitment: '30 min/day',
            difficulty: 'Based on your tech stack'
          }
        ],
        systemDesign: [
          'Practice designing scalable systems',
          'Study common architectures (microservices, event-driven)',
          'Learn about load balancing, caching, and databases',
          'Practice explaining trade-offs and design decisions'
        ],
        technicalTopics: this.getTechnicalTopics(currentSkills, targetRole)
      },
      behavioralPrep: [
        {
          category: 'Leadership',
          questions: [
            'Tell me about a time you led a technical project',
            'How do you handle disagreements in code reviews?',
            'Describe a situation where you had to mentor a junior developer'
          ]
        },
        {
          category: 'Problem Solving',
          questions: [
            'Describe a challenging technical problem you solved',
            'How do you approach debugging complex issues?',
            'Tell me about a time you had to learn a new technology quickly'
          ]
        },
        {
          category: 'Collaboration',
          questions: [
            'How do you work with non-technical stakeholders?',
            'Describe a time you had to compromise on a technical decision',
            'How do you handle tight deadlines and competing priorities?'
          ]
        }
      ],
      companyResearch: [
        'Study the company\'s tech stack and architecture',
        'Understand their business model and recent news',
        'Research the engineering culture and values',
        'Prepare thoughtful questions about the role and team'
      ],
      practiceSchedule: {
        '4 weeks before': 'Start daily coding practice and system design study',
        '2 weeks before': 'Focus on company-specific preparation and mock interviews',
        '1 week before': 'Review your projects and prepare STAR method examples',
        'Day before': 'Light review, prepare questions, and get good rest'
      }
    };
  }

  // Helper methods
  determineUserRole(bertKeywords) {
    const roles = bertKeywords.roles || [];
    const technical = bertKeywords.technical || [];
    
    if (roles.includes('manager') || roles.includes('lead')) return 'Engineering Manager';
    if (roles.includes('senior')) return 'Senior Developer';
    if (roles.includes('architect')) return 'Software Architect';
    if (technical.includes('react') || technical.includes('frontend')) return 'Frontend Developer';
    if (technical.includes('node.js') || technical.includes('backend')) return 'Backend Developer';
    if (technical.includes('python') && technical.includes('machine learning')) return 'ML Engineer';
    
    return 'Software Developer';
  }

  determineCareerLevel(bertKeywords, profileData) {
    const experience = profileData.experience?.years || 0;
    const roles = bertKeywords.roles || [];
    
    if (experience >= 8 || roles.includes('principal') || roles.includes('staff')) return 'senior';
    if (experience >= 4 || roles.includes('senior') || roles.includes('lead')) return 'mid';
    return 'junior';
  }

  calculateSkillPriority(category, userRole, missingSkills) {
    const rolePriorities = {
      'Frontend Developer': { frontend: 10, backend: 6, cloud: 8, mobile: 7 },
      'Backend Developer': { backend: 10, cloud: 9, data: 8, devops: 8 },
      'Full Stack Developer': { frontend: 8, backend: 8, cloud: 9, devops: 7 },
      'ML Engineer': { data: 10, cloud: 9, backend: 7, devops: 6 }
    };
    
    return (rolePriorities[userRole]?.[category] || 5) * missingSkills.length;
  }

  getMarketDemand(category) {
    const demand = {
      'cloud': 'very high',
      'data': 'very high', 
      'frontend': 'high',
      'backend': 'high',
      'mobile': 'medium',
      'devops': 'high'
    };
    return demand[category] || 'medium';
  }

  estimateLearningTime(skills) {
    return `${skills.length * 2}-${skills.length * 4} weeks`;
  }

  estimateSalaryImpact(skills) {
    return `$${skills.length * 3000}-${skills.length * 8000}`;
  }

  calculatePathProbability(bertKeywords, pathType) {
    const experience = bertKeywords.experience || 0;
    const skills = bertKeywords.technical?.length || 0;
    
    const baseProbability = {
      'senior_tech': Math.min(85, 40 + experience * 8 + skills * 2),
      'tech_lead': Math.min(75, 20 + experience * 6 + skills * 3),
      'specialist': Math.min(70, 15 + experience * 5 + skills * 4),
      'management': Math.min(65, 25 + experience * 7),
      'entrepreneur': Math.min(45, 20 + skills * 2)
    };
    
    return baseProbability[pathType] || 50;
  }

  calculateSkillValue(skills) {
    const skillValues = {
      'machine learning': 25000, 'aws': 20000, 'kubernetes': 18000,
      'react': 15000, 'python': 15000, 'typescript': 12000,
      'node.js': 12000, 'docker': 10000, 'javascript': 8000
    };
    
    return skills.reduce((total, skill) => {
      return total + (skillValues[skill.toLowerCase()] || 5000);
    }, 80000);
  }

  estimateCurrentSalary(skills, experience, location) {
    const baseByExperience = [60000, 75000, 90000, 110000, 130000, 150000];
    const base = baseByExperience[Math.min(experience, 5)] || 150000;
    const skillBonus = this.calculateSkillValue(skills) - 80000;
    const locationMultiplier = location.includes('San Francisco') ? 1.4 : 
                              location.includes('New York') ? 1.3 : 
                              location.includes('Remote') ? 1.1 : 1.0;
    
    return Math.round((base + skillBonus) * locationMultiplier);
  }

  calculateOptimizedSalary(skills, experience) {
    return this.estimateCurrentSalary(skills, experience, 'San Francisco') * 1.25;
  }

  getMissingKeywords(currentSkills) {
    const highDemandKeywords = [
      'cloud architecture', 'microservices', 'kubernetes', 'terraform',
      'machine learning', 'data science', 'cybersecurity', 'blockchain'
    ];
    
    return highDemandKeywords.filter(keyword => 
      !currentSkills.some(skill => skill.toLowerCase().includes(keyword))
    );
  }

  getTechnicalTopics(skills, targetRole) {
    const topics = {
      'Senior Developer': [
        'System design and architecture patterns',
        'Database optimization and scaling',
        'API design and microservices',
        'Performance optimization techniques'
      ],
      'Tech Lead': [
        'Technical leadership and mentoring',
        'Code review best practices',
        'Architecture decision making',
        'Cross-team collaboration'
      ],
      'Engineering Manager': [
        'Team building and hiring',
        'Technical strategy and roadmaps',
        'Performance management',
        'Stakeholder communication'
      ]
    };
    
    return topics[targetRole] || topics['Senior Developer'];
  }

  calculateCareerScore(bertKeywords, profileData) {
    const skillsScore = (bertKeywords.technical?.length || 0) * 5;
    const experienceScore = (profileData.experience?.years || 0) * 8;
    const educationScore = profileData.education ? 15 : 0;
    const profileScore = profileData.completeness || 50;
    
    return Math.min(100, skillsScore + experienceScore + educationScore + profileScore);
  }

  getPriorityActions(suggestions) {
    const actions = [];
    
    // High-impact, quick wins
    if (suggestions.skillGaps.length > 0) {
      actions.push({
        action: `Learn ${suggestions.skillGaps[0].missingSkills[0]}`,
        impact: 'high',
        effort: 'medium',
        timeframe: '1-2 months'
      });
    }
    
    actions.push({
      action: 'Optimize LinkedIn profile and resume',
      impact: 'high',
      effort: 'low',
      timeframe: '1 week'
    });
    
    actions.push({
      action: 'Start networking and building online presence',
      impact: 'medium',
      effort: 'low',
      timeframe: 'ongoing'
    });
    
    return actions;
  }
}

module.exports = new CareerImprovementService();