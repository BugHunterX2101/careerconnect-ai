const axios = require('axios');

class RealTimeJobService {
  constructor() {
    this.jobSources = [
      {
        name: 'GitHub Jobs',
        url: 'https://jobs.github.com/positions.json',
        active: false // GitHub Jobs API was discontinued
      },
      {
        name: 'RemoteOK',
        url: 'https://remoteok.io/api',
        active: true
      },
      {
        name: 'JSearch (RapidAPI)',
        url: 'https://jsearch.p.rapidapi.com/search',
        active: false // Requires API key
      }
    ];
  }

  async getRealtimeJobs(userProfile, preferences = {}) {
    const allJobs = [];
    
    // Try LinkedIn API
    try {
      const { searchLinkedInJobs } = require('./linkedinService');
      const linkedInJobs = await searchLinkedInJobs({
        keywords: this.extractKeywords(userProfile),
        location: preferences.location || 'Remote',
        limit: 10
      });
      allJobs.push(...linkedInJobs.map(job => ({
        ...job,
        source: 'LinkedIn',
        isRealTime: true,
        isExternal: true,
        url: job.applicationUrl
      })));
    } catch (error) {
      console.log('LinkedIn API failed:', error.message);
    }
    
    // Try RemoteOK API
    try {
      const remoteJobs = await this.fetchRemoteOKJobs(userProfile, preferences);
      allJobs.push(...remoteJobs);
    } catch (error) {
      console.log('RemoteOK API failed, using fallback');
    }

    return this.rankAndFilterJobs(allJobs, userProfile, preferences);
  }

  extractKeywords(userProfile) {
    const keywords = [];
    
    if (userProfile.skills) {
      keywords.push(...userProfile.skills.slice(0, 3));
    }
    
    if (userProfile.experience && userProfile.experience.length > 0) {
      keywords.push(userProfile.experience[0].title);
    }
    
    return keywords.join(' ');
  }

  async fetchRemoteOKJobs(_userProfile, _preferences) {
    try {
      const response = await axios.get('https://remoteok.io/api', {
        timeout: 5000,
        headers: {
          'User-Agent': 'CareerConnect-AI/1.0'
        }
      });

      const jobs = response.data.slice(1); // First item is metadata
      
      return jobs.slice(0, 20).map(job => ({
        id: job.id,
        title: job.position,
        company: job.company,
        location: 'Remote',
        salary: job.salary || 'Competitive',
        description: job.description || '',
        skills: job.tags || [],
        url: job.url,
        posted: new Date(job.date).toISOString(),
        source: 'RemoteOK',
        isRealTime: true,
        isExternal: true,
        remote: true,
        type: 'Full-time'
      }));
    } catch (error) {
      console.error('RemoteOK API error:', error.message);
      return [];
    }
  }

  generateRealisticJobs(_userProfile, _preferences) {
    return [];
  }

  rankAndFilterJobs(jobs, userProfile, preferences) {
    const userSkills = (userProfile.skills || []).map(s => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    );

    // Calculate match scores
    const scoredJobs = jobs.map(job => {
      let matchScore = 50; // Base score

      // Skill matching (40 points max)
      if (job.skills && job.skills.length > 0) {
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const matchingSkills = userSkills.filter(skill => 
          jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
        );
        matchScore += (matchingSkills.length / Math.max(userSkills.length, 1)) * 40;
      }

      // Location preference (10 points max)
      if (preferences.location) {
        if (job.location.toLowerCase().includes(preferences.location.toLowerCase())) {
          matchScore += 10;
        }
      }

      // Remote preference
      if (preferences.remote && job.remote) {
        matchScore += 5;
      }

      // Recency bonus (5 points max)
      const daysOld = (Date.now() - new Date(job.posted).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        matchScore += 5 - (daysOld / 7) * 5;
      }

      return {
        ...job,
        matchScore: Math.min(Math.round(matchScore), 100)
      };
    });

    // Sort by match score and return top results
    return scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, preferences.limit || 20);
  }

  async searchJobs(query, userProfile, filters = {}) {
    try {
      const searchResults = this.generateSearchResults(query, userProfile, filters);
      return this.rankAndFilterJobs(searchResults, userProfile, filters);
    } catch (error) {
      console.error('Search jobs error:', error.message);
      return [];
    }
  }

  generateSearchResults(query, _userProfile, _filters) {
    const jobs = [];
    const queryLower = query.toLowerCase();
    
    return jobs.filter(job => 
      job.title.toLowerCase().includes(queryLower) ||
      job.company.toLowerCase().includes(queryLower) ||
      job.skills.some(skill => skill.toLowerCase().includes(queryLower))
    );
  }
}

module.exports = new RealTimeJobService();