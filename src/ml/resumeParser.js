const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const { NlpManager } = require('node-nlp');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ml.log' }),
    new winston.transports.Console()
  ]
});

class ResumeParser {
  constructor() {
    this.model = null;
    this.nlpManager = new NlpManager({ languages: ['en'] });
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.skillKeywords = new Set();
    this.jobTitleKeywords = new Set();
    this.educationKeywords = new Set();
    this.loadKeywords();
  }

  async initialize() {
    try {
      logger.info('Initializing Resume Parser...');
      
      // Load BERT model
      this.model = await use.load();
      logger.info('BERT model loaded successfully');
      
      // Load NLP manager
      await this.loadNLPManager();
      logger.info('NLP Manager loaded successfully');
      
      logger.info('Resume Parser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resume Parser:', error);
      throw error;
    }
  }

  async loadKeywords() {
    try {
      // Load skill keywords from file or use default
      const skillKeywordsPath = path.join(__dirname, '../data/skills.json');
      const jobTitleKeywordsPath = path.join(__dirname, '../data/job_titles.json');
      const educationKeywordsPath = path.join(__dirname, '../data/education.json');

      try {
        const skillsData = await fs.readFile(skillKeywordsPath, 'utf8');
        const jobTitlesData = await fs.readFile(jobTitleKeywordsPath, 'utf8');
        const educationData = await fs.readFile(educationKeywordsPath, 'utf8');

        const skills = JSON.parse(skillsData);
        const jobTitles = JSON.parse(jobTitlesData);
        const education = JSON.parse(educationData);

        this.skillKeywords = new Set(skills);
        this.jobTitleKeywords = new Set(jobTitles);
        this.educationKeywords = new Set(education);
      } catch (error) {
        logger.warn('Keyword files not found, using default keywords');
        this.loadDefaultKeywords();
      }
    } catch (error) {
      logger.error('Error loading keywords:', error);
      this.loadDefaultKeywords();
    }
  }

  loadDefaultKeywords() {
    // Default skill keywords
    const defaultSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'mongodb', 'sql',
      'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
      'angular', 'vue.js', 'express.js', 'django', 'flask', 'spring',
      'postgresql', 'mysql', 'redis', 'elasticsearch', 'kafka', 'rabbitmq',
      'machine learning', 'ai', 'data science', 'statistics', 'r', 'matlab',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
      'tableau', 'power bi', 'excel', 'word', 'powerpoint', 'photoshop',
      'illustrator', 'figma', 'sketch', 'invision', 'zeplin'
    ];

    // Default job title keywords
    const defaultJobTitles = [
      'software engineer', 'developer', 'programmer', 'full stack',
      'frontend', 'backend', 'devops', 'data scientist', 'analyst',
      'manager', 'director', 'lead', 'architect', 'consultant',
      'designer', 'ui/ux', 'product manager', 'project manager',
      'qa engineer', 'test engineer', 'system administrator',
      'network engineer', 'security engineer', 'cloud engineer'
    ];

    // Default education keywords
    const defaultEducation = [
      'bachelor', 'master', 'phd', 'degree', 'university', 'college',
      'computer science', 'engineering', 'mathematics', 'statistics',
      'business', 'economics', 'finance', 'marketing', 'management'
    ];

    this.skillKeywords = new Set(defaultSkills);
    this.jobTitleKeywords = new Set(defaultJobTitles);
    this.educationKeywords = new Set(defaultEducation);
  }

  async loadNLPManager() {
    // Add training data for entity extraction
    this.nlpManager.addDocument('en', 'I have experience in %skill%', 'skill.extract');
    this.nlpManager.addDocument('en', 'I worked as %jobtitle%', 'jobtitle.extract');
    this.nlpManager.addDocument('en', 'I studied %education%', 'education.extract');
    
    await this.nlpManager.train();
  }

  async parseResume(filePath, fileType) {
    try {
      logger.info(`Starting resume parsing for file: ${filePath}`);
      
      // Extract text from file
      const text = await this.extractText(filePath, fileType);
      if (!text) {
        throw new Error('Failed to extract text from file');
      }

      // Parse the extracted text
      const parsedData = await this.parseText(text);
      
      // Perform AI analysis
      const aiAnalysis = await this.performAIAnalysis(text, parsedData);
      
      logger.info('Resume parsing completed successfully');
      
      return {
        ...parsedData,
        aiAnalysis
      };
    } catch (error) {
      logger.error('Error parsing resume:', error);
      throw error;
    }
  }

  async extractText(filePath, fileType) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          const pdfData = await pdfParse(fileBuffer);
          return pdfData.text;
        
        case 'txt':
          return fileBuffer.toString('utf8');
        
        case 'doc':
        case 'docx':
          // For DOC/DOCX files, you might need additional libraries
          // For now, we'll return a placeholder
          throw new Error('DOC/DOCX parsing not implemented yet');
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error('Error extracting text:', error);
      throw error;
    }
  }

  async parseText(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const sections = this.identifySections(lines);
      
      const parsedData = {
        personalInfo: await this.extractPersonalInfo(text),
        summary: await this.extractSummary(sections.summary),
        education: await this.extractEducation(sections.education),
        experience: await this.extractExperience(sections.experience),
        skills: await this.extractSkills(text),
        projects: await this.extractProjects(sections.projects),
        certifications: await this.extractCertifications(sections.certifications),
        languages: await this.extractLanguages(sections.languages)
      };

      return parsedData;
    } catch (error) {
      logger.error('Error parsing text:', error);
      throw error;
    }
  }

  identifySections(lines) {
    const sections = {
      summary: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      languages: []
    };

    let currentSection = null;
    const sectionKeywords = {
      'summary': ['summary', 'objective', 'profile', 'about'],
      'education': ['education', 'academic', 'degree', 'university', 'college'],
      'experience': ['experience', 'work', 'employment', 'career'],
      'projects': ['projects', 'portfolio', 'achievements'],
      'certifications': ['certifications', 'certificates', 'credentials'],
      'languages': ['languages', 'language skills']
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Identify section headers
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(keyword => lowerLine.includes(keyword))) {
          currentSection = section;
          break;
        }
      }

      if (currentSection && sections[currentSection]) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  async extractPersonalInfo(text) {
    try {
      const personalInfo = {};
      
      // Extract email
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = text.match(emailRegex);
      if (emails && emails.length > 0) {
        personalInfo.email = emails[0];
      }

      // Extract phone
      const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phones = text.match(phoneRegex);
      if (phones && phones.length > 0) {
        personalInfo.phone = phones[0];
      }

      // Extract LinkedIn
      const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g;
      const linkedin = text.match(linkedinRegex);
      if (linkedin && linkedin.length > 0) {
        personalInfo.linkedin = linkedin[0];
      }

      // Extract GitHub
      const githubRegex = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+\/?/g;
      const github = text.match(githubRegex);
      if (github && github.length > 0) {
        personalInfo.github = github[0];
      }

      // Extract name (first few lines, usually contains name)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine && !firstLine.includes('@') && !firstLine.includes('http')) {
          personalInfo.fullName = firstLine;
        }
      }

      return personalInfo;
    } catch (error) {
      logger.error('Error extracting personal info:', error);
      return {};
    }
  }

  async extractSummary(summaryLines) {
    try {
      if (!summaryLines || summaryLines.length === 0) return '';
      
      const summaryText = summaryLines.join(' ').trim();
      return summaryText.length > 500 ? summaryText.substring(0, 500) + '...' : summaryText;
    } catch (error) {
      logger.error('Error extracting summary:', error);
      return '';
    }
  }

  async extractEducation(educationLines) {
    try {
      const education = [];
      
      if (!educationLines || educationLines.length === 0) return education;

      let currentEducation = {};
      
      for (const line of educationLines) {
        const lowerLine = line.toLowerCase();
        
        // Look for degree patterns
        const degreePatterns = [
          /bachelor|b\.s\.|b\.a\.|bs|ba/i,
          /master|m\.s\.|m\.a\.|ms|ma/i,
          /phd|doctorate|doctor/i,
          /associate|a\.s\.|aa/i
        ];

        const hasDegree = degreePatterns.some(pattern => pattern.test(line));
        
        if (hasDegree) {
          if (Object.keys(currentEducation).length > 0) {
            education.push(currentEducation);
          }
          currentEducation = { degree: line.trim() };
        } else if (line.includes('University') || line.includes('College') || line.includes('Institute')) {
          currentEducation.institution = line.trim();
        } else if (/\d{4}/.test(line)) {
          // Extract years
          const years = line.match(/\d{4}/g);
          if (years && years.length >= 2) {
            currentEducation.startDate = new Date(years[0], 0, 1);
            currentEducation.endDate = new Date(years[1], 0, 1);
          }
        }
      }

      if (Object.keys(currentEducation).length > 0) {
        education.push(currentEducation);
      }

      return education;
    } catch (error) {
      logger.error('Error extracting education:', error);
      return [];
    }
  }

  async extractExperience(experienceLines) {
    try {
      const experience = [];
      
      if (!experienceLines || experienceLines.length === 0) return experience;

      let currentExperience = {};
      
      for (const line of experienceLines) {
        const lowerLine = line.toLowerCase();
        
        // Look for company patterns
        if (line.includes('Inc.') || line.includes('LLC') || line.includes('Corp') || 
            line.includes('Company') || line.includes('Ltd')) {
          if (Object.keys(currentExperience).length > 0) {
            experience.push(currentExperience);
          }
          currentExperience = { company: line.trim() };
        } else if (lowerLine.includes('developer') || lowerLine.includes('engineer') || 
                   lowerLine.includes('manager') || lowerLine.includes('analyst')) {
          currentExperience.position = line.trim();
        } else if (/\d{4}/.test(line)) {
          // Extract years
          const years = line.match(/\d{4}/g);
          if (years && years.length >= 2) {
            currentExperience.startDate = new Date(years[0], 0, 1);
            currentExperience.endDate = new Date(years[1], 0, 1);
          }
        } else if (line.trim() && !line.includes('•') && !line.includes('-')) {
          if (currentExperience.description) {
            currentExperience.description += ' ' + line.trim();
          } else {
            currentExperience.description = line.trim();
          }
        }
      }

      if (Object.keys(currentExperience).length > 0) {
        experience.push(currentExperience);
      }

      return experience;
    } catch (error) {
      logger.error('Error extracting experience:', error);
      return [];
    }
  }

  async extractSkills(text) {
    try {
      const skills = [];
      const words = this.tokenizer.tokenize(text.toLowerCase());
      
      for (const word of words) {
        if (this.skillKeywords.has(word)) {
          skills.push({
            name: word,
            level: 'intermediate',
            confidence: 0.8,
            category: this.categorizeSkill(word)
          });
        }
      }

      // Remove duplicates
      const uniqueSkills = skills.filter((skill, index, self) => 
        index === self.findIndex(s => s.name === skill.name)
      );

      return uniqueSkills;
    } catch (error) {
      logger.error('Error extracting skills:', error);
      return [];
    }
  }

  categorizeSkill(skill) {
    const categories = {
      programming: ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust'],
      framework: ['react', 'angular', 'vue', 'express', 'django', 'flask', 'spring'],
      database: ['mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
      tool: ['git', 'jenkins', 'jira', 'confluence'],
      language: ['english', 'spanish', 'french', 'german', 'chinese']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.includes(skill)) {
        return category;
      }
    }

    return 'other';
  }

  async extractProjects(projectLines) {
    try {
      const projects = [];
      
      if (!projectLines || projectLines.length === 0) return projects;

      let currentProject = {};
      
      for (const line of projectLines) {
        if (line.trim() && !line.includes('•') && !line.includes('-')) {
          if (Object.keys(currentProject).length > 0) {
            projects.push(currentProject);
          }
          currentProject = { name: line.trim() };
        } else if (line.trim()) {
          if (currentProject.description) {
            currentProject.description += ' ' + line.trim();
          } else {
            currentProject.description = line.trim();
          }
        }
      }

      if (Object.keys(currentProject).length > 0) {
        projects.push(currentProject);
      }

      return projects;
    } catch (error) {
      logger.error('Error extracting projects:', error);
      return [];
    }
  }

  async extractCertifications(certificationLines) {
    try {
      const certifications = [];
      
      if (!certificationLines || certificationLines.length === 0) return certifications;

      for (const line of certificationLines) {
        if (line.trim() && !line.includes('•') && !line.includes('-')) {
          certifications.push({
            name: line.trim(),
            issuingOrganization: '',
            issueDate: null
          });
        }
      }

      return certifications;
    } catch (error) {
      logger.error('Error extracting certifications:', error);
      return [];
    }
  }

  async extractLanguages(languageLines) {
    try {
      const languages = [];
      
      if (!languageLines || languageLines.length === 0) return languages;

      for (const line of languageLines) {
        const words = this.tokenizer.tokenize(line.toLowerCase());
        for (const word of words) {
          if (this.educationKeywords.has(word) && word.length > 2) {
            languages.push({
              name: word,
              proficiency: 'conversational'
            });
          }
        }
      }

      return languages;
    } catch (error) {
      logger.error('Error extracting languages:', error);
      return [];
    }
  }

  async performAIAnalysis(text, parsedData) {
    try {
      logger.info('Performing AI analysis...');
      
      // Generate embeddings for text
      const embeddings = await this.model.embed([text]);
      const embeddingArray = await embeddings.array();
      
      // Calculate scores
      const skillsScore = this.calculateSkillsScore(parsedData.skills);
      const experienceScore = this.calculateExperienceScore(parsedData.experience);
      const educationScore = this.calculateEducationScore(parsedData.education);
      
      // Calculate overall score
      const overallScore = Math.round((skillsScore + experienceScore + educationScore) / 3);
      
      // Extract keywords using BERT embeddings
      const extractedKeywords = await this.extractKeywordsWithBERT(embeddingArray[0], text);
      
      // Generate suggestions
      const suggestedImprovements = this.generateSuggestions(parsedData, overallScore);
      
      // Extract job titles and industries
      const jobTitles = this.extractJobTitles(text);
      const industries = this.extractIndustries(text);
      
      return {
        overallScore,
        skillsScore,
        experienceScore,
        educationScore,
        extractedKeywords,
        suggestedImprovements,
        jobTitles,
        industries
      };
    } catch (error) {
      logger.error('Error performing AI analysis:', error);
      return {
        overallScore: 0,
        skillsScore: 0,
        experienceScore: 0,
        educationScore: 0,
        extractedKeywords: [],
        suggestedImprovements: [],
        jobTitles: [],
        industries: []
      };
    }
  }

  calculateSkillsScore(skills) {
    if (!skills || skills.length === 0) return 0;
    
    const totalSkills = skills.length;
    const highConfidenceSkills = skills.filter(skill => skill.confidence > 0.7).length;
    const diverseCategories = new Set(skills.map(skill => skill.category)).size;
    
    return Math.min(100, Math.round((totalSkills * 10) + (highConfidenceSkills * 5) + (diverseCategories * 10)));
  }

  calculateExperienceScore(experience) {
    if (!experience || experience.length === 0) return 0;
    
    const totalYears = experience.reduce((total, exp) => {
      if (exp.startDate && exp.endDate) {
        const years = (new Date(exp.endDate) - new Date(exp.startDate)) / (1000 * 60 * 60 * 24 * 365.25);
        return total + Math.max(0, years);
      }
      return total;
    }, 0);
    
    return Math.min(100, Math.round(totalYears * 20));
  }

  calculateEducationScore(education) {
    if (!education || education.length === 0) return 0;
    
    let score = 0;
    for (const edu of education) {
      if (edu.degree) {
        const degree = edu.degree.toLowerCase();
        if (degree.includes('phd') || degree.includes('doctorate')) score += 40;
        else if (degree.includes('master')) score += 30;
        else if (degree.includes('bachelor')) score += 20;
        else if (degree.includes('associate')) score += 10;
      }
    }
    
    return Math.min(100, score);
  }

  async extractKeywordsWithBERT(embedding, text) {
    try {
      const words = this.tokenizer.tokenize(text.toLowerCase());
      const keywords = [];
      
      for (const word of words) {
        if (word.length > 3 && this.skillKeywords.has(word)) {
          keywords.push({
            keyword: word,
            confidence: 0.8,
            category: this.categorizeSkill(word)
          });
        }
      }
      
      return keywords.slice(0, 20); // Return top 20 keywords
    } catch (error) {
      logger.error('Error extracting keywords with BERT:', error);
      return [];
    }
  }

  generateSuggestions(parsedData, overallScore) {
    const suggestions = [];
    
    if (overallScore < 50) {
      suggestions.push({
        category: 'content',
        suggestion: 'Consider adding more detailed work experience and achievements',
        priority: 'high',
        impact: 80
      });
    }
    
    if (!parsedData.skills || parsedData.skills.length < 5) {
      suggestions.push({
        category: 'skills',
        suggestion: 'Add more technical skills and specify proficiency levels',
        priority: 'high',
        impact: 70
      });
    }
    
    if (!parsedData.summary || parsedData.summary.length < 100) {
      suggestions.push({
        category: 'content',
        suggestion: 'Add a compelling professional summary',
        priority: 'medium',
        impact: 60
      });
    }
    
    return suggestions;
  }

  extractJobTitles(text) {
    const jobTitles = [];
    const words = this.tokenizer.tokenize(text.toLowerCase());
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (this.jobTitleKeywords.has(bigram)) {
        jobTitles.push({
          title: bigram,
          confidence: 0.8
        });
      }
    }
    
    return jobTitles.slice(0, 5);
  }

  extractIndustries(text) {
    // Simple industry extraction based on keywords
    const industryKeywords = {
      'technology': ['software', 'tech', 'it', 'development'],
      'finance': ['banking', 'finance', 'investment', 'accounting'],
      'healthcare': ['medical', 'health', 'pharmaceutical', 'hospital'],
      'education': ['education', 'teaching', 'academic', 'university']
    };
    
    const industries = [];
    const words = this.tokenizer.tokenize(text.toLowerCase());
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const matches = keywords.filter(keyword => words.includes(keyword));
      if (matches.length > 0) {
        industries.push({
          industry,
          confidence: matches.length / keywords.length
        });
      }
    }
    
    return industries.slice(0, 3);
  }
}

module.exports = ResumeParser;
