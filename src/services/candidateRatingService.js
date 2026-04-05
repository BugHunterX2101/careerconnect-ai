
class CandidateRatingService {
  /**
   * Calculate comprehensive candidate rating for a job
   * @param {Object} candidate - Candidate profile and resume
   * @param {Object} job - Job posting with requirements
   * @returns {Object} Detailed rating and scoring
   */
  calculateCandidateRating(candidate, job) {
    const scores = {
      overall: 0,
      category: {},
      strengths: [],
      concerns: [],
      recommendations: []
    };

    // 1. Skills Match (35% weight)
    const skillsAnalysis = this.analyzeSkillsMatch(candidate, job);
    scores.category.skills = skillsAnalysis.score;
    scores.overall += skillsAnalysis.score * 0.35;
    if (skillsAnalysis.score >= 80) {
      scores.strengths.push(skillsAnalysis.strength);
    } else if (skillsAnalysis.score < 50) {
      scores.concerns.push(skillsAnalysis.concern);
    }

    // 2. Experience Match (30% weight)
    const experienceAnalysis = this.analyzeExperience(candidate, job);
    scores.category.experience = experienceAnalysis.score;
    scores.overall += experienceAnalysis.score * 0.30;
    if (experienceAnalysis.score >= 80) {
      scores.strengths.push(experienceAnalysis.strength);
    } else if (experienceAnalysis.score < 50) {
      scores.concerns.push(experienceAnalysis.concern);
    }

    // 3. Education Match (10% weight)
    const educationAnalysis = this.analyzeEducation(candidate, job);
    scores.category.education = educationAnalysis.score;
    scores.overall += educationAnalysis.score * 0.10;

    // 4. Cultural Fit & Soft Skills (10% weight)
    const softSkillsAnalysis = this.analyzeSoftSkills(candidate, job);
    scores.category.softSkills = softSkillsAnalysis.score;
    scores.overall += softSkillsAnalysis.score * 0.10;

    // 5. Career Trajectory (10% weight)
    const trajectoryAnalysis = this.analyzeCareerTrajectory(candidate);
    scores.category.careerTrajectory = trajectoryAnalysis.score;
    scores.overall += trajectoryAnalysis.score * 0.10;

    // 6. Additional Factors (5% weight)
    const additionalAnalysis = this.analyzeAdditionalFactors(candidate, job);
    scores.category.additional = additionalAnalysis.score;
    scores.overall += additionalAnalysis.score * 0.05;

    // Round overall score
    scores.overall = Math.round(scores.overall);

    // Determine rating tier
    scores.tier = this.determineRatingTier(scores.overall);
    scores.recommendation = this.generateHiringRecommendation(scores.overall, scores.strengths, scores.concerns);

    // Generate detailed breakdown
    scores.breakdown = this.generateDetailedBreakdown(candidate, job, {
      skills: skillsAnalysis,
      experience: experienceAnalysis,
      education: educationAnalysis,
      softSkills: softSkillsAnalysis,
      trajectory: trajectoryAnalysis,
      additional: additionalAnalysis
    });

    return scores;
  }

  /**
   * Analyze skills match between candidate and job
   */
  analyzeSkillsMatch(candidate, job) {
    const candidateSkills = this.extractCandidateSkills(candidate);
    const requiredSkills = job.requiredSkills || [];
    const preferredSkills = job.preferredSkills || [];

    // Match required skills
    const matchedRequired = requiredSkills.filter(skill => 
      candidateSkills.some(cs => 
        cs.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(cs.toLowerCase())
      )
    );

    // Match preferred skills
    const matchedPreferred = preferredSkills.filter(skill =>
      candidateSkills.some(cs =>
        cs.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cs.toLowerCase())
      )
    );

    // Calculate score
    const requiredScore = requiredSkills.length > 0 
      ? (matchedRequired.length / requiredSkills.length) * 100 
      : 100;
    
    const preferredScore = preferredSkills.length > 0
      ? (matchedPreferred.length / preferredSkills.length) * 100
      : 0;

    const finalScore = Math.round(requiredScore * 0.8 + preferredScore * 0.2);

    return {
      score: finalScore,
      matchedRequired,
      missingRequired: requiredSkills.filter(s => !matchedRequired.includes(s)),
      matchedPreferred,
      strength: `Strong match: ${matchedRequired.length}/${requiredSkills.length} required skills`,
      concern: `Missing ${requiredSkills.length - matchedRequired.length} key skills`,
      details: {
        requiredSkills: requiredSkills.length,
        matchedRequired: matchedRequired.length,
        preferredSkills: preferredSkills.length,
        matchedPreferred: matchedPreferred.length,
        candidateTotalSkills: candidateSkills.length
      }
    };
  }

  /**
   * Analyze experience match
   */
  analyzeExperience(candidate, job) {
    const candidateExp = this.extractExperience(candidate);
    const jobLevel = job.experienceLevel || 'mid';

    // Experience level mapping
    const levelMap = {
      'entry': { min: 0, max: 2, preferred: 0 },
      'mid': { min: 2, max: 5, preferred: 3 },
      'senior': { min: 5, max: 10, preferred: 7 },
      'lead': { min: 8, max: 20, preferred: 10 },
      'principal': { min: 12, max: 30, preferred: 15 }
    };

    const requirement = levelMap[jobLevel.toLowerCase()] || levelMap['mid'];
    const yearsExp = candidateExp.totalYears;

    let score = 0;
    let strength = '';
    let concern = '';

    if (yearsExp >= requirement.preferred) {
      score = 100;
      strength = `${yearsExp} years experience - Exceeds requirements for ${jobLevel} level`;
    } else if (yearsExp >= requirement.min) {
      const range = requirement.max - requirement.min;
      const position = yearsExp - requirement.min;
      score = 70 + (position / range) * 30;
      strength = `${yearsExp} years experience - meets ${jobLevel} level requirements`;
    } else if (yearsExp >= requirement.min * 0.75) {
      score = 60;
      concern = `${yearsExp} years experience - slightly below ${jobLevel} level (${requirement.min}+ years expected)`;
    } else {
      score = 40;
      concern = `${yearsExp} years experience - below ${jobLevel} level requirements`;
    }

    // Bonus for relevant experience
    const relevantPositions = this.findRelevantPositions(candidateExp.positions, job);
    if (relevantPositions.length > 0) {
      score = Math.min(100, score + 10);
    }

    return {
      score: Math.round(score),
      strength,
      concern,
      details: {
        totalYears: yearsExp,
        requiredMin: requirement.min,
        requiredMax: requirement.max,
        positions: candidateExp.positions.length,
        relevantPositions: relevantPositions.length,
        recentRoles: candidateExp.positions.slice(0, 2).map(p => p.title)
      }
    };
  }

  /**
   * Analyze education match
   */
  analyzeEducation(candidate, job) {
    const candidateEdu = this.extractEducation(candidate);
    const jobEdu = job.educationRequired || job.education;

    if (!jobEdu) {
      return { score: 100, strength: 'No specific education requirement' };
    }

    const eduLevels = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };

    const requiredLevel = eduLevels[jobEdu.toLowerCase()] || 3;
    const candidateLevel = Math.max(...candidateEdu.degrees.map(d => 
      eduLevels[d.toLowerCase()] || 0
    ));

    let score = 0;
    if (candidateLevel >= requiredLevel) {
      score = 100;
    } else if (candidateLevel >= requiredLevel - 1) {
      score = 75;
    } else {
      score = 50;
    }

    // Bonus for relevant field of study
    const relevantField = candidateEdu.fields.some(field =>
      job.title.toLowerCase().includes(field.toLowerCase()) ||
      field.toLowerCase().includes('computer') ||
      field.toLowerCase().includes('engineering')
    );

    if (relevantField) {
      score = Math.min(100, score + 10);
    }

    return{
      score,
      details: {
        candidateLevel: candidateLevel,
        requiredLevel: requiredLevel,
        degrees: candidateEdu.degrees,
        fields: candidateEdu.fields,
        institutions: candidateEdu.institutions
      }
    };
  }

  /**
   * Analyze soft skills and cultural fit
   */
  analyzeSoftSkills(candidate, _job) {
    const softSkillsKeywords = [
      'leadership', 'communication', 'teamwork', 'problem-solving',
      'analytical', 'creative', 'adaptable', 'organized',
      'detail-oriented', 'collaborative', 'innovative'
    ];

    const resumeText = this.extractResumeText(candidate).toLowerCase();
    const matchedSoftSkills = softSkillsKeywords.filter(skill =>
      resumeText.includes(skill)
    );

    const score = (matchedSoftSkills.length / softSkillsKeywords.length) * 100;

    return {
      score: Math.round(score),
      matchedSkills: matchedSoftSkills,
      details: {
        totalFound: matchedSoftSkills.length,
        totalChecked: softSkillsKeywords.length
      }
    };
  }

  /**
   * Analyze career trajectory
   */
  analyzeCareerTrajectory(candidate) {
    const experience = this.extractExperience(candidate);
    const positions = experience.positions;

    if (positions.length === 0) {
      return { score: 50, pattern: 'No work history' };
    }

    // Check for progression
    let progressionScore = 50;
    let pattern = 'Steady';

    // Look for title progression
    const titleProgression = this.analyzeTitleProgression(positions);
    if (titleProgression === 'upward') {
      progressionScore = 90;
      pattern = 'Progressive growth';
    } else if (titleProgression === 'lateral') {
      progressionScore = 70;
      pattern = 'Lateral movement';
    } else if (titleProgression === 'mixed') {
      progressionScore = 60;
      pattern = 'Mixed trajectory';
    }

    // Check job stability
    const avgTenure = this.calculateAverageTenure(positions);
    if (avgTenure >= 2) {
      progressionScore = Math.min(100, progressionScore + 10);
    } else if (avgTenure < 1) {
      progressionScore -= 15;
      pattern += ' (frequent job changes)';
    }

    return {
      score: Math.round(Math.max(0, progressionScore)),
      pattern,
      details: {
        totalPositions: positions.length,
        averageTenure: avgTenure.toFixed(1),
        titleProgression
      }
    };
  }

  /**
   * Analyze additional factors
   */
  analyzeAdditionalFactors(candidate, _job) {
    let score = 70; // Base score

    // Portfolio/Projects
    if (candidate.resume?.projects && candidate.resume.projects.length > 0) {
      score += 10;
    }

    // Certifications
    if (candidate.resume?.certifications && candidate.resume.certifications.length > 0) {
      score += 10;
    }

    // GitHub/Portfolio link
    if (candidate.profile?.github || candidate.profile?.website) {
      score += 5;
    }

    // LinkedIn profile
    if (candidate.profile?.linkedin) {
      score += 5;
    }

    return {
      score: Math.min(100, score),
      details: {
        hasProjects: !!(candidate.resume?.projects?.length > 0),
        hasCertifications: !!(candidate.resume?.certifications?.length > 0),
        hasPortfolio: !!(candidate.profile?.website || candidate.profile?.github),
        hasLinkedIn: !!candidate.profile?.linkedin
      }
    };
  }

  /**
   * Determine rating tier
   */
  determineRatingTier(score) {
    if (score >= 90) return { level: 'Exceptional', stars: 5, color: 'gold', emoji: '⭐⭐⭐⭐⭐' };
    if (score >= 80) return { level: 'Strong Match', stars: 4, color: 'green', emoji: '⭐⭐⭐⭐' };
    if (score >= 70) return { level: 'Good Match', stars: 3, color: 'blue', emoji: '⭐⭐⭐' };
    if (score >= 60) return { level: 'Moderate Match', stars: 2, color: 'orange', emoji: '⭐⭐' };
    return { level: 'Weak Match', stars: 1, color: 'red', emoji: '⭐' };
  }

  /**
   * Generate hiring recommendation
   */
  generateHiringRecommendation(score, _strengths, _concerns) {
    if (score >= 85) {
      return {
        action: 'Strong Recommend',
        priority: 'High',
        message: 'Excellent candidate - Schedule interview immediately',
        nextSteps: [
          'Fast-track to technical interview',
          'Prepare targeted questions about top skills',
          'Check references if moving forward'
        ]
      };
    } else if (score >= 75) {
      return {
        action: 'Recommend',
        priority: 'Medium-High',
        message: 'Strong candidate - Good fit for the role',
        nextSteps: [
          'Schedule phone screen',
          'Assess missing skills during interview',
          'Consider for technical assessment'
        ]
      };
    } else if (score >= 65) {
      return {
        action: 'Consider',
        priority: 'Medium',
        message: 'Potential candidate - Some gaps to address',
        nextSteps: [
          'Review portfolio/projects if available',
          'Phone screen to assess missing skills',
          'Consider if open to training/growth'
        ]
      };
    } else if (score >= 50) {
      return {
        action: 'Weak Match',
        priority: 'Low',
        message: 'Significant skill gaps - Consider only if desperate',
        nextSteps: [
          'Review carefully before proceeding',
          'Assess if candidate can quickly upskill',
          'Consider for junior roles instead'
        ]
      };
    } else {
      return {
        action: 'Not Recommended',
        priority: 'Reject',
        message: 'Poor match for this position',
        nextSteps: [
          'Send polite rejection',
          'Keep in database for future openings',
          'Suggest more suitable roles if available'
        ]
      };
    }
  }

  /**
   * Generate detailed breakdown for employer review
   */
  generateDetailedBreakdown(candidate, job, analyses) {
    return {
      candidateInfo: {
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        location: candidate.profile?.location || 'Not specified',
        yearsExperience: analyses.experience.details.totalYears,
        currentRole: analyses.experience.details.recentRoles[0] || 'Not specified'
      },
      skillsBreakdown: {
        score: analyses.skills.score,
        matched: analyses.skills.matchedRequired,
        missing: analyses.skills.missingRequired,
        additional: analyses.skills.matchedPreferred,
        totalSkills: analyses.skills.details.candidateTotalSkills
      },
      experienceBreakdown: {
        score: analyses.experience.score,
        years: analyses.experience.details.totalYears,
        relevantPositions: analyses.experience.details.relevantPositions,
        recentRoles: analyses.experience.details.recentRoles
      },
      educationBreakdown: {
        score: analyses.education.score,
        degrees: analyses.education.details.degrees,
        fields: analyses.education.details.fields
      },
      strengthsAndConcerns: {
        strengths: analyses.skills.strength ? [analyses.skills.strength] : [],
        concerns: analyses.skills.concern ? [analyses.skills.concern] : []
      },
      careerProgression: {
        score: analyses.trajectory.score,
        pattern: analyses.trajectory.pattern,
        avgTenure: analyses.trajectory.details.averageTenure
      }
    };
  }

  /**
   * Extract candidate skills from profile and resume
   */
  extractCandidateSkills(candidate) {
    const skills = new Set();

    if (candidate.profile?.skills) {
      candidate.profile.skills.forEach(skill => skills.add(skill));
    }

    if (candidate.resume?.skills) {
      candidate.resume.skills.forEach(skill => {
        skills.add(skill.name || skill);
      });
    }

    return Array.from(skills);
  }

  /**
   * Extract experience information
   */
  extractExperience(candidate) {
    const positions = [];
    let totalYears = 0;

    if (candidate.resume?.experience) {
      positions.push(...candidate.resume.experience);
      totalYears = candidate.resume.experience.reduce((sum, exp) => 
        sum + (exp.duration || exp.years || 0), 0
      );
    }

    if (candidate.profile?.experience) {
      if (candidate.profile.experience.positions) {
        positions.push(...candidate.profile.experience.positions);
      }
      if (candidate.profile.experience.years) {
        totalYears = Math.max(totalYears, candidate.profile.experience.years);
      }
    }

    return { positions, totalYears };
  }

  /**
   * Extract education information
   */
  extractEducation(candidate) {
    const degrees = [];
    const fields = [];
    const institutions = [];

    if (candidate.resume?.education) {
      candidate.resume.education.forEach(edu => {
        if (edu.degree) degrees.push(edu.degree);
        if (edu.field ||edu.major) fields.push(edu.field || edu.major);
        if (edu.institution) institutions.push(edu.institution);
      });
    }

    if (candidate.profile?.education) {
      if (candidate.profile.education.degree) {
        degrees.push(candidate.profile.education.degree);
      }
      if (candidate.profile.education.field) {
        fields.push(candidate.profile.education.field);
      }
    }

    return { degrees, fields, institutions };
  }

  /**
   * Extract resume text for keyword analysis
   */
  extractResumeText(candidate) {
    let text = '';

    if (candidate.resume?.summary) text += candidate.resume.summary + ' ';
    if (candidate.resume?.objective) text += candidate.resume.objective + ' ';
    if (candidate.profile?.about) text += candidate.profile.about + ' ';

    if (candidate.resume?.experience) {
      candidate.resume.experience.forEach(exp => {
        if (exp.description) text += exp.description + ' ';
        if (exp.responsibilities) text += exp.responsibilities.join(' ') + ' ';
      });
    }

    return text;
  }

  /**
   * Find relevant positions matching job requirements
   */
  findRelevantPositions(positions, job) {
    return positions.filter(position => {
      const titleMatch = position.title?.toLowerCase().includes(job.title.toLowerCase().split(' ')[0]);
      const skillMatch = job.requiredSkills?.some(skill =>
        position.description?.toLowerCase().includes(skill.toLowerCase())
      );
      return titleMatch || skillMatch;
    });
  }

  /**
   * Analyze title progression
   */
  analyzeTitleProgression(positions) {
    if (positions.length < 2) return 'insufficient';

    const juniorKeywords = ['junior', 'associate', 'intern', 'entry'];
    const midKeywords = ['developer', 'engineer', 'analyst', 'consultant'];
    const seniorKeywords = ['senior', 'lead', 'principal', 'staff', 'architect'];
    const leadershipKeywords = ['manager', 'director', 'vp', 'head', 'chief'];

    const getLevel = (title) => {
      const lower = title.toLowerCase();
      if (leadershipKeywords.some(k => lower.includes(k))) return 4;
      if (seniorKeywords.some(k => lower.includes(k))) return 3;
      if (midKeywords.some(k => lower.includes(k))) return 2;
      if (juniorKeywords.some(k => lower.includes(k))) return 1;
      return 2; // default mid-level
    };

    const levels = positions.map(p => getLevel(p.title));
    const progressionCount = levels.reduce((count, level, i) => {
      if (i > 0 && level > levels[i - 1]) return count + 1;
      return count;
    }, 0);

    if (progressionCount >= 2) return 'upward';
    if (progressionCount === 1) return 'mixed';
    if (levels.every((l, i) => i === 0 || l === levels[0])) return 'lateral';
    return 'mixed';
  }

  /**
   * Calculate average tenure across positions
   */
  calculateAverageTenure(positions) {
    if (positions.length === 0) return 0;

    const totalTenure = positions.reduce((sum, position) => {
      return sum + (position.duration || position.years || 1);
    }, 0);

    return totalTenure / positions.length;
  }
}

module.exports = new CandidateRatingService();
