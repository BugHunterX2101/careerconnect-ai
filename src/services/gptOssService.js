const OpenAI = require('openai');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize OpenAI client with GPT-OSS configuration
const openai = new OpenAI({
  apiKey: process.env.GPT_OSS_API_KEY,
  baseURL: process.env.GPT_OSS_BASE_URL || 'https://api.openai.com/v1',
  dangerouslyAllowBrowser: false
});

class GPTOSSService {
  constructor() {
    this.model = process.env.GPT_OSS_MODEL || 'gpt-oss-120b';
    this.maxTokens = 4000;
    this.temperature = 0.7;
  }

  /**
   * Generate job recommendations based on resume analysis
   * @param {Object} resumeData - Parsed resume data
   * @param {Object} preferences - Job search preferences
   * @returns {Promise<Array>} Array of job recommendations
   */
  async generateJobRecommendations(resumeData, preferences = {}) {
    try {
      const {
        skills = [],
        experience = [],
        education = [],
        summary = '',
        personalInfo = {},
        limit = 20,
        location = '',
        remoteOnly = false,
        minSalary = 0,
        maxSalary = 0,
        employmentType = 'full-time',
        seniorityLevel = ''
      } = { ...resumeData, ...preferences };

      // Create a comprehensive prompt for job recommendations
      const prompt = this.buildJobRecommendationPrompt({
        skills,
        experience,
        education,
        summary,
        personalInfo,
        preferences: {
          limit,
          location,
          remoteOnly,
          minSalary,
          maxSalary,
          employmentType,
          seniorityLevel
        }
      });

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career advisor and job matching specialist. Analyze the provided resume and generate personalized job recommendations that match the candidate\'s skills, experience, and preferences. Provide detailed, actionable recommendations with specific job titles, companies, and reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const recommendations = JSON.parse(response.choices[0].message.content);
      
      logger.info('Job recommendations generated successfully', {
        resumeId: resumeData.id,
        recommendationsCount: recommendations.jobs?.length || 0
      });

      return recommendations.jobs || [];
    } catch (error) {
      logger.error('Error generating job recommendations:', error);
      throw new Error(`Failed to generate job recommendations: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for job recommendations
   */
  buildJobRecommendationPrompt(data) {
    const {
      skills,
      experience,
      education,
      summary,
      personalInfo,
      preferences
    } = data;

    const skillsText = skills.map(skill => 
      `${skill.name} (${skill.level || 'intermediate'})`
    ).join(', ');

    const experienceText = experience.map(exp => 
      `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`
    ).join('\n');

    const educationText = education.map(edu => 
      `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`
    ).join('\n');

    return `
Please analyze the following resume and generate personalized job recommendations:

CANDIDATE PROFILE:
- Name: ${personalInfo.fullName || 'Not specified'}
- Summary: ${summary || 'Not provided'}
- Location: ${personalInfo.address || 'Not specified'}

SKILLS:
${skillsText}

EXPERIENCE:
${experienceText}

EDUCATION:
${educationText}

JOB PREFERENCES:
- Desired location: ${preferences.location || 'Any'}
- Remote work: ${preferences.remoteOnly ? 'Required' : 'Optional'}
- Salary range: $${preferences.minSalary || 0} - $${preferences.maxSalary || 'Open'}
- Employment type: ${preferences.employmentType}
- Seniority level: ${preferences.seniorityLevel || 'Any'}

Please provide ${preferences.limit || 20} job recommendations in the following JSON format:

{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Job Location",
      "type": "full-time|part-time|contract|internship",
      "remote": true|false,
      "salary_range": {
        "min": 50000,
        "max": 80000,
        "currency": "USD"
      },
      "match_score": 85,
      "reasoning": "Detailed explanation of why this job matches the candidate",
      "required_skills": ["skill1", "skill2"],
      "preferred_skills": ["skill3", "skill4"],
      "job_description": "Brief job description",
      "application_url": "https://example.com/apply",
      "posted_date": "2024-01-15",
      "seniority_level": "entry|mid|senior|lead|executive"
    }
  ],
  "analysis": {
    "overall_match_score": 82,
    "strengths": ["List of candidate's strengths"],
    "areas_for_improvement": ["Areas where candidate could improve"],
    "market_insights": "Current market trends and opportunities",
    "salary_insights": "Salary expectations and market rates"
  }
}

Focus on:
1. Jobs that match the candidate's skills and experience level
2. Companies and roles that align with their career goals
3. Opportunities that fit their location and remote preferences
4. Positions with appropriate salary ranges
5. Roles that offer growth potential
6. Companies with good culture and benefits

Provide realistic, actionable recommendations with specific reasoning for each match.
`;
  }

  /**
   * Analyze resume and provide improvement suggestions
   * @param {Object} resumeData - Parsed resume data
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeResume(resumeData) {
    try {
      const {
        skills = [],
        experience = [],
        education = [],
        summary = '',
        personalInfo = {}
      } = resumeData;

      const prompt = `
Please analyze the following resume and provide comprehensive feedback:

RESUME CONTENT:
- Summary: ${summary}
- Skills: ${skills.map(s => s.name).join(', ')}
- Experience: ${experience.length} positions
- Education: ${education.length} degrees/certifications

Please provide analysis in the following JSON format:

{
  "overall_score": 75,
  "scores": {
    "skills": 80,
    "experience": 70,
    "education": 85,
    "format": 90
  },
  "strengths": ["List of resume strengths"],
  "weaknesses": ["Areas that need improvement"],
  "recommendations": [
    {
      "category": "skills|experience|education|format|content",
      "suggestion": "Specific improvement suggestion",
      "priority": "high|medium|low",
      "impact": 85
    }
  ],
  "keywords": ["extracted", "relevant", "keywords"],
  "industry_match": "Technology|Healthcare|Finance|etc",
  "seniority_level": "entry|mid|senior|lead",
  "estimated_salary": {
    "min": 50000,
    "max": 80000,
    "currency": "USD"
  }
}
`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume reviewer and career advisor. Provide detailed, constructive feedback to help improve the resume.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      logger.info('Resume analysis completed', {
        resumeId: resumeData.id,
        overallScore: analysis.overall_score
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing resume:', error);
      throw new Error(`Failed to analyze resume: ${error.message}`);
    }
  }

  /**
   * Generate personalized career advice
   * @param {Object} userProfile - User profile data
   * @param {Array} jobHistory - Job application history
   * @returns {Promise<Object>} Career advice
   */
  async generateCareerAdvice(userProfile, jobHistory = []) {
    try {
      const prompt = `
Based on the following user profile and job application history, provide personalized career advice:

USER PROFILE:
- Current role: ${userProfile.currentRole || 'Not specified'}
- Years of experience: ${userProfile.yearsOfExperience || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Career goals: ${userProfile.careerGoals || 'Not specified'}

JOB APPLICATION HISTORY:
${jobHistory.map(job => `- ${job.title} at ${job.company} (${job.status})`).join('\n')}

Please provide advice in the following JSON format:

{
  "career_path": {
    "short_term": "Next 6-12 months goals",
    "medium_term": "1-3 year career path",
    "long_term": "5+ year vision"
  },
  "skill_gaps": [
    {
      "skill": "skill name",
      "importance": "high|medium|low",
      "learning_path": "How to acquire this skill"
    }
  ],
  "networking_advice": "Networking strategies and opportunities",
  "industry_trends": "Current trends in the industry",
  "salary_negotiation": "Salary negotiation tips",
  "interview_preparation": "Interview preparation advice"
}
`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach and mentor. Provide personalized, actionable career advice based on the user\'s profile and history.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const advice = JSON.parse(response.choices[0].message.content);
      
      logger.info('Career advice generated', {
        userId: userProfile.id
      });

      return advice;
    } catch (error) {
      logger.error('Error generating career advice:', error);
      throw new Error(`Failed to generate career advice: ${error.message}`);
    }
  }

  /**
   * Test the GPT-OSS connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with "GPT-OSS-120B is working correctly"'
          }
        ],
        max_tokens: 50,
        temperature: 0
      });

      const result = response.choices[0].message.content;
      logger.info('GPT-OSS connection test successful', { result });
      return true;
    } catch (error) {
      logger.error('GPT-OSS connection test failed:', error);
      return false;
    }
  }
}

module.exports = new GPTOSSService();
