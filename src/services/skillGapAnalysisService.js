const bertService = require('./bertResumeService');

class SkillGapAnalysisService {
  constructor() {
    this.highPayingSkills = {
      'AI/ML': { skills: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision'], salary: 150000, growth: 45 },
      'Cloud Architecture': { skills: ['aws', 'azure', 'gcp', 'kubernetes', 'terraform', 'cloud native'], salary: 145000, growth: 38 },
      'DevOps/SRE': { skills: ['kubernetes', 'docker', 'jenkins', 'ci/cd', 'monitoring', 'infrastructure as code'], salary: 140000, growth: 35 },
      'Data Engineering': { skills: ['spark', 'airflow', 'kafka', 'data pipelines', 'etl', 'big data'], salary: 138000, growth: 40 },
      'Blockchain': { skills: ['solidity', 'ethereum', 'smart contracts', 'web3', 'defi'], salary: 135000, growth: 30 },
      'Cybersecurity': { skills: ['penetration testing', 'security', 'cryptography', 'threat analysis'], salary: 142000, growth: 33 },
      'Full Stack': { skills: ['react', 'node.js', 'typescript', 'graphql', 'microservices', 'system design'], salary: 130000, growth: 28 }
    };
  }

  async analyzeSkillGaps(resumeText, currentSalary = 0) {
    const parsed = await bertService.parseResumeWithBERT(resumeText);
    const currentSkills = parsed.skills.technical;
    
    const gaps = await this.identifyGaps(currentSkills, parsed.skills.embedding);
    const recommendations = this.generateRecommendations(gaps, currentSalary);
    const learningPath = this.createLearningPath(gaps);

    return {
      currentSkills,
      skillGaps: gaps,
      recommendations,
      learningPath,
      salaryPotential: this.calculateSalaryPotential(currentSkills, gaps),
      timeToHighPaying: this.estimateTimeToHighPaying(gaps)
    };
  }

  async identifyGaps(currentSkills, skillEmbedding) {
    const gaps = [];

    for (const [category, data] of Object.entries(this.highPayingSkills)) {
      const missingSkills = data.skills.filter(skill => 
        !currentSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
      );

      if (missingSkills.length > 0) {
        const relevance = await this.calculateRelevance(currentSkills, data.skills, skillEmbedding);
        
        gaps.push({
          category,
          missingSkills,
          totalSkills: data.skills.length,
          coverage: ((data.skills.length - missingSkills.length) / data.skills.length * 100).toFixed(0),
          avgSalary: data.salary,
          growthRate: data.growth,
          relevance,
          priority: this.calculatePriority(missingSkills.length, data.salary, data.growth, relevance),
          learningTime: this.estimateLearningTime(missingSkills),
          salaryImpact: this.estimateSalaryImpact(missingSkills, data.salary)
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  async calculateRelevance(currentSkills, targetSkills, skillEmbedding = null) {
    if (!currentSkills.length) return 0;
    
    const overlap = targetSkills.filter(ts => 
      currentSkills.some(cs => cs.toLowerCase().includes(ts.toLowerCase()))
    ).length;

    const lexicalScore = (overlap / targetSkills.length) * 100;

    // Blend lexical overlap with USE semantic similarity when embeddings are available.
    try {
      const hasEmbedding = !!skillEmbedding;
      if (!hasEmbedding) {
        return Math.round(lexicalScore);
      }

      const semanticSimilarity = await bertService.calculateSimilarity(
        currentSkills.join(' '),
        targetSkills.join(' ')
      );

      if (!Number.isFinite(semanticSimilarity) || semanticSimilarity <= 0) {
        return Math.round(lexicalScore);
      }

      const semanticScore = Math.max(0, Math.min(100, semanticSimilarity * 100));
      return Math.round((lexicalScore * 0.6) + (semanticScore * 0.4));
    } catch (error) {
      return Math.round(lexicalScore);
    }
  }

  calculatePriority(missingCount, salary, growth, relevance) {
    const salaryWeight = salary / 150000 * 40;
    const growthWeight = growth / 45 * 30;
    const relevanceWeight = relevance / 100 * 20;
    const gapWeight = (1 - missingCount / 6) * 10;
    
    return Math.round(salaryWeight + growthWeight + relevanceWeight + gapWeight);
  }

  estimateLearningTime(skills) {
    const timePerSkill = { basic: 4, intermediate: 8, advanced: 12 };
    const totalWeeks = skills.length * timePerSkill.intermediate;
    
    return {
      weeks: totalWeeks,
      months: Math.ceil(totalWeeks / 4),
      hoursPerWeek: 10,
      display: `${Math.ceil(totalWeeks / 4)} months (10 hrs/week)`
    };
  }

  estimateSalaryImpact(skills, baseSalary) {
    const impactPerSkill = baseSalary / 20;
    const totalImpact = skills.length * impactPerSkill;
    
    return {
      min: Math.round(totalImpact * 0.7),
      max: Math.round(totalImpact * 1.3),
      display: `$${Math.round(totalImpact * 0.7 / 1000)}k-$${Math.round(totalImpact * 1.3 / 1000)}k`
    };
  }

  generateRecommendations(gaps, currentSalary) {
    const top3 = gaps.slice(0, 3);
    
    return top3.map(gap => ({
      category: gap.category,
      reason: `High demand (${gap.growthRate}% growth) with avg salary $${gap.avgSalary / 1000}k`,
      skillsToLearn: gap.missingSkills.slice(0, 3),
      currentCoverage: `${gap.coverage}%`,
      potentialIncrease: gap.salaryImpact.display,
      timeInvestment: gap.learningTime.display,
      priority: gap.priority >= 80 ? 'Critical' : gap.priority >= 60 ? 'High' : 'Medium',
      resources: this.getResources(gap.category),
      nextSteps: this.getNextSteps(gap.category, gap.missingSkills[0])
    }));
  }

  createLearningPath(gaps) {
    const topGap = gaps[0];
    if (!topGap) return { phases: [] };

    const skills = topGap.missingSkills.slice(0, 4);
    
    return {
      goal: `Become proficient in ${topGap.category}`,
      targetSalary: `$${topGap.avgSalary / 1000}k`,
      totalTime: topGap.learningTime.display,
      phases: [
        {
          phase: 1,
          duration: '1-2 months',
          focus: 'Fundamentals',
          skills: [skills[0]],
          activities: [
            `Complete ${skills[0]} fundamentals course`,
            'Build 2-3 small projects',
            'Read official documentation'
          ]
        },
        {
          phase: 2,
          duration: '2-3 months',
          focus: 'Intermediate Skills',
          skills: skills.slice(1, 3),
          activities: [
            'Build production-grade project',
            'Contribute to open source',
            'Get hands-on with real scenarios'
          ]
        },
        {
          phase: 3,
          duration: '1-2 months',
          focus: 'Advanced & Certification',
          skills: [skills[3] || 'Advanced topics'],
          activities: [
            'Obtain relevant certification',
            'Build portfolio project',
            'Start applying to jobs'
          ]
        }
      ],
      milestones: [
        { month: 2, achievement: 'First project completed', salaryIncrease: '+$10k' },
        { month: 4, achievement: 'Intermediate proficiency', salaryIncrease: '+$20k' },
        { month: 6, achievement: 'Job-ready with certification', salaryIncrease: '+$30k+' }
      ]
    };
  }

  calculateSalaryPotential(currentSkills, gaps) {
    const currentValue = this.estimateCurrentValue(currentSkills);
    const topGap = gaps[0];
    
    if (!topGap) {
      return {
        current: currentValue,
        potential: currentValue * 1.2,
        increase: currentValue * 0.2
      };
    }

    const potential = topGap.avgSalary;
    
    return {
      current: currentValue,
      potential: potential,
      increase: potential - currentValue,
      percentIncrease: Math.round((potential - currentValue) / currentValue * 100),
      timeline: topGap.learningTime.months + ' months',
      display: `$${currentValue / 1000}k → $${potential / 1000}k (+${Math.round((potential - currentValue) / currentValue * 100)}%)`
    };
  }

  estimateCurrentValue(skills) {
    const baseValue = 80000;
    const skillValue = skills.length * 5000;
    
    const premiumSkills = ['machine learning', 'aws', 'kubernetes', 'react', 'python'];
    const premiumBonus = skills.filter(s => 
      premiumSkills.some(ps => s.toLowerCase().includes(ps))
    ).length * 8000;
    
    return Math.min(baseValue + skillValue + premiumBonus, 150000);
  }

  estimateTimeToHighPaying(gaps) {
    if (!gaps.length) return { months: 0, display: 'Already qualified' };
    
    const topGap = gaps[0];
    const months = topGap.learningTime.months;
    
    return {
      months,
      display: `${months} months with focused learning`,
      breakdown: {
        learning: `${months - 1} months`,
        jobSearch: '1 month',
        hoursPerWeek: 10
      }
    };
  }

  getResources(category) {
    const resources = {
      'AI/ML': [
        'Andrew Ng Machine Learning Course (Coursera)',
        'Fast.ai Practical Deep Learning',
        'Kaggle competitions for practice'
      ],
      'Cloud Architecture': [
        'AWS Solutions Architect Certification',
        'A Cloud Guru platform',
        'AWS Well-Architected Framework'
      ],
      'DevOps/SRE': [
        'Kubernetes Administrator (CKA) cert',
        'Docker Deep Dive book',
        'DevOps Handbook'
      ],
      'Data Engineering': [
        'Data Engineering on GCP course',
        'Spark: The Definitive Guide',
        'Airflow documentation'
      ],
      'Blockchain': [
        'CryptoZombies (Solidity)',
        'Ethereum.org tutorials',
        'Web3 University'
      ],
      'Cybersecurity': [
        'CompTIA Security+',
        'OWASP Top 10',
        'HackTheBox practice'
      ],
      'Full Stack': [
        'Full Stack Open (University of Helsinki)',
        'System Design Primer',
        'Build real-world projects'
      ]
    };
    
    return resources[category] || ['Online courses', 'Documentation', 'Practice projects'];
  }

  getNextSteps(category, firstSkill) {
    return [
      `Start with ${firstSkill} fundamentals this week`,
      `Dedicate 10 hours/week to learning`,
      `Build a small project within 2 weeks`,
      `Join ${category} community/forum`,
      `Set up portfolio to showcase work`
    ];
  }

  async compareWithJob(resumeText, jobDescription) {
    const resumeParsed = await bertService.parseResumeWithBERT(resumeText);
    const jobParsed = await bertService.parseResumeWithBERT(jobDescription);
    
    const similarity = await bertService.calculateSimilarity(
      resumeParsed.summary,
      jobDescription
    );

    const matchingSkills = resumeParsed.skills.technical.filter(skill =>
      jobParsed.skills.technical.some(js => js.toLowerCase().includes(skill.toLowerCase()))
    );

    const missingSkills = jobParsed.skills.technical.filter(skill =>
      !resumeParsed.skills.technical.some(rs => rs.toLowerCase().includes(skill.toLowerCase()))
    );

    return {
      overallMatch: Math.round(similarity * 100),
      matchingSkills,
      missingSkills,
      recommendation: similarity > 0.7 ? 'Strong match - Apply now' :
                     similarity > 0.5 ? 'Good match - Learn missing skills' :
                     'Weak match - Significant gaps',
      skillsToLearn: missingSkills.slice(0, 3),
      estimatedTime: this.estimateLearningTime(missingSkills.slice(0, 3)).display
    };
  }
}

module.exports = new SkillGapAnalysisService();
