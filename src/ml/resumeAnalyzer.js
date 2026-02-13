const { getGPTOSSResponse } = require('../services/gptOssService');

class ResumeAnalyzer {
  async analyzeResumeWithAI(parsedData) {
    try {
      const prompt = `Analyze this resume and provide detailed improvement suggestions:

Personal Info: ${JSON.stringify(parsedData.personalInfo)}
Education: ${JSON.stringify(parsedData.education)}
Experience: ${JSON.stringify(parsedData.experience)}
Skills: ${JSON.stringify(parsedData.skills)}
Summary: ${parsedData.summary}

Provide analysis in this JSON format:
{
  "overallScore": 85,
  "overallAssessment": "Brief overall assessment",
  "strengths": ["List of strengths"],
  "improvementAreas": [
    {
      "area": "Area name",
      "issue": "What's wrong",
      "suggestion": "How to improve",
      "priority": "high/medium/low",
      "examples": ["Specific examples"]
    }
  ],
  "skillGaps": ["Missing skills for target roles"],
  "industryTrends": ["Relevant industry trends to consider"],
  "actionItems": ["Specific next steps"]
}`;

      const response = await getGPTOSSResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      return this.getFallbackAnalysis(parsedData);
    }
  }

  getFallbackAnalysis(parsedData) {
    return {
      overallScore: 75,
      overallAssessment: 'Resume shows good foundation but has areas for improvement',
      strengths: [
        'Contact information provided',
        'Work experience included',
        'Skills section present'
      ],
      improvementAreas: [
        {
          area: 'Skills Section',
          issue: 'Skills may need updating with current technologies',
          suggestion: 'Add more current industry-relevant skills and certifications',
          priority: 'high',
          examples: ['Cloud technologies (AWS, Azure)', 'Modern frameworks', 'DevOps tools']
        },
        {
          area: 'Experience Description',
          issue: 'Job descriptions could be more detailed',
          suggestion: 'Use action verbs and quantify achievements',
          priority: 'medium',
          examples: ['Increased efficiency by 30%', 'Led team of 5 developers']
        }
      ],
      skillGaps: ['Cloud computing', 'Modern web frameworks', 'Data analysis'],
      industryTrends: ['AI/ML integration', 'Remote work capabilities', 'Agile methodologies'],
      actionItems: [
        'Update skills section with current technologies',
        'Add quantifiable achievements to work experience',
        'Consider adding relevant certifications'
      ]
    };
  }
}

module.exports = ResumeAnalyzer;