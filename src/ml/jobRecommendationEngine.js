const { getGPTOSSResponse } = require('../services/gptOssService');
const { searchLinkedInJobs } = require('../services/linkedinService');

class JobRecommendationEngine {
  async getPersonalizedRecommendations(userProfile, preferences = {}) {
    try {
      // Get AI-powered job recommendations
      const aiRecommendations = await this.getAIRecommendations(userProfile, preferences);
      
      // Get real-time LinkedIn jobs
      const linkedInJobs = await this.getLinkedInJobs(userProfile, preferences);
      
      // Combine and rank recommendations
      const combinedJobs = this.combineAndRankJobs(aiRecommendations, linkedInJobs);
      
      return {
        success: true,
        recommendations: combinedJobs,
        totalCount: combinedJobs.length,
        sources: ['AI Analysis', 'LinkedIn API'],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  async getAIRecommendations(userProfile, preferences) {
    try {
      const prompt = `Based on this user profile, recommend relevant job titles and requirements:

Skills: ${userProfile.skills?.map(s => s.name || s).join(', ')}
Experience: ${userProfile.experience?.map(e => `${e.title} at ${e.company}`).join(', ')}
Education: ${userProfile.education?.map(e => `${e.degree} from ${e.institution}`).join(', ')}
Location Preference: ${preferences.location || 'Remote/Flexible'}
Salary Range: ${preferences.salaryRange || 'Market rate'}
Job Type: ${preferences.jobType || 'Full-time'}

Provide job recommendations in this JSON format:
{
  "recommendations": [
    {
      "title": "Job Title",
      "company": "Suggested Company Type",
      "location": "Location",
      "salaryRange": "Salary estimate",
      "matchScore": 95,
      "requiredSkills": ["skill1", "skill2"],
      "description": "Why this job matches",
      "growthPotential": "Career growth description"
    }
  ]
}`;

      const response = await getGPTOSSResponse(prompt);
      const aiData = JSON.parse(response);
      return aiData.recommendations || [];
    } catch (error) {
      console.error('AI recommendations failed:', error);
      return [];
    }
  }

  async getLinkedInJobs(userProfile, preferences) {
    try {
      const searchParams = {
        keywords: this.extractKeywords(userProfile),
        location: preferences.location || 'United States',
        experienceLevel: this.determineExperienceLevel(userProfile),
        jobType: preferences.jobType || 'F', // Full-time
        limit: 20
      };

      const jobs = await searchLinkedInJobs(searchParams);
      
      return jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || 'Company',
        location: job.location || 'Remote',
        salaryRange: job.salary || 'Competitive',
        description: job.description || '',
        url: job.url || job.applyUrl,
        postedDate: job.postedAt,
        matchScore: this.calculateMatchScore(job, userProfile),
        source: 'LinkedIn',
        isRealTime: true
      }));
    } catch (error) {
      console.error('LinkedIn job search failed:', error);
      return [];
    }
  }

  extractKeywords(userProfile) {
    const keywords = [];
    
    // Extract from skills
    if (userProfile.skills) {
      keywords.push(...userProfile.skills.map(s => s.name || s));
    }
    
    // Extract from recent job titles
    if (userProfile.experience && userProfile.experience.length > 0) {
      keywords.push(userProfile.experience[0].title);
    }
    
    return keywords.slice(0, 5).join(' '); // Top 5 keywords
  }

  determineExperienceLevel(userProfile) {
    if (!userProfile.experience || userProfile.experience.length === 0) {
      return 'entry';
    }
    
    const totalYears = userProfile.experience.length * 2; // Rough estimate
    
    if (totalYears < 2) return 'entry';
    if (totalYears < 5) return 'mid';
    return 'senior';
  }

  calculateMatchScore(job, userProfile) {
    let score = 50; // Base score
    
    // Check skill matches
    if (userProfile.skills && job.description) {
      const userSkills = userProfile.skills.map(s => (s.name || s).toLowerCase());
      const jobDesc = job.description.toLowerCase();
      
      const matchingSkills = userSkills.filter(skill => 
        jobDesc.includes(skill)
      );
      
      score += (matchingSkills.length / userSkills.length) * 30;
    }
    
    // Check title similarity
    if (userProfile.experience && userProfile.experience.length > 0) {
      const userTitle = userProfile.experience[0].title.toLowerCase();
      const jobTitle = job.title.toLowerCase();
      
      if (jobTitle.includes(userTitle) || userTitle.includes(jobTitle)) {
        score += 20;
      }
    }
    
    return Math.min(Math.round(score), 100);
  }

  combineAndRankJobs(aiJobs, linkedInJobs) {
    const allJobs = [
      ...aiJobs.map(job => ({ ...job, source: 'AI', isRealTime: false })),
      ...linkedInJobs
    ];
    
    // Sort by match score and recency
    return allJobs
      .sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Prefer real-time jobs
        if (a.isRealTime !== b.isRealTime) {
          return b.isRealTime - a.isRealTime;
        }
        return 0;
      })
      .slice(0, 50); // Limit to top 50 recommendations
  }

  getFallbackRecommendations(userProfile) {
    return {
      success: true,
      recommendations: [
        {
          title: 'Software Developer',
          company: 'Tech Company',
          location: 'Remote',
          salaryRange: '$70,000 - $120,000',
          matchScore: 85,
          description: 'Great match based on your technical skills',
          source: 'Fallback',
          isRealTime: false
        },
        {
          title: 'Full Stack Engineer',
          company: 'Startup',
          location: 'San Francisco, CA',
          salaryRange: '$90,000 - $140,000',
          matchScore: 80,
          description: 'Matches your full-stack experience',
          source: 'Fallback',
          isRealTime: false
        }
      ],
      totalCount: 2,
      sources: ['Fallback'],
      lastUpdated: new Date().toISOString()
    };
  }

  async getJobSearchResults(query, userProfile, filters = {}) {
    try {
      // Enhanced search with AI understanding
      const enhancedQuery = await this.enhanceSearchQuery(query, userProfile);
      
      const searchParams = {
        keywords: enhancedQuery,
        location: filters.location || 'United States',
        experienceLevel: filters.experienceLevel || this.determineExperienceLevel(userProfile),
        jobType: filters.jobType || 'F',
        salaryRange: filters.salaryRange,
        limit: filters.limit || 30
      };

      const jobs = await searchLinkedInJobs(searchParams);
      
      return jobs.map(job => ({
        ...job,
        matchScore: this.calculateMatchScore(job, userProfile),
        relevanceReason: this.explainRelevance(job, userProfile)
      }));
    } catch (error) {
      console.error('Job search failed:', error);
      return [];
    }
  }

  async enhanceSearchQuery(query, userProfile) {
    try {
      const prompt = `Enhance this job search query based on user profile:

Original Query: "${query}"
User Skills: ${userProfile.skills?.map(s => s.name || s).join(', ')}
User Experience: ${userProfile.experience?.[0]?.title || 'Not specified'}

Provide an enhanced search query that includes relevant synonyms and related terms:`;

      const response = await getGPTOSSResponse(prompt);
      return response.trim();
    } catch (error) {
      return query; // Fallback to original query
    }
  }

  explainRelevance(job, userProfile) {
    const reasons = [];
    
    if (userProfile.skills) {
      const userSkills = userProfile.skills.map(s => (s.name || s).toLowerCase());
      const jobDesc = job.description?.toLowerCase() || '';
      
      const matchingSkills = userSkills.filter(skill => 
        jobDesc.includes(skill)
      );
      
      if (matchingSkills.length > 0) {
        reasons.push(`Matches your skills: ${matchingSkills.slice(0, 3).join(', ')}`);
      }
    }
    
    if (userProfile.experience && userProfile.experience.length > 0) {
      const userTitle = userProfile.experience[0].title.toLowerCase();
      const jobTitle = job.title.toLowerCase();
      
      if (jobTitle.includes(userTitle) || userTitle.includes(jobTitle)) {
        reasons.push('Similar to your current role');
      }
    }
    
    return reasons.join('; ') || 'Good general match';
  }
}

module.exports = JobRecommendationEngine;