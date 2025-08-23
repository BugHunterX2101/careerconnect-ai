const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

class ResumeParser {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Load pre-trained model (placeholder - you would load your actual model)
      // this.model = await tf.loadLayersModel('file://./ml/models/resume_parser_model.json');
      
      // Initialize tokenizer
      this.tokenizer = new natural.WordTokenizer();
      
      this.isInitialized = true;
      console.log('ResumeParser initialized successfully');
    } catch (error) {
      console.error('Error initializing ResumeParser:', error);
      throw error;
    }
  }

  async parseResume(filePath) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      let text = '';

      if (fileExtension === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } else if (fileExtension === '.txt') {
        text = await fs.readFile(filePath, 'utf8');
      } else {
        throw new Error('Unsupported file format');
      }

      // Extract sections
      const sections = this.extractSections(text);
      
      // Parse each section
      const parsedData = {
        personalInfo: this.extractPersonalInfo(sections.personal || ''),
        education: this.extractEducation(sections.education || ''),
        experience: this.extractExperience(sections.experience || ''),
        skills: this.extractSkills(sections.skills || ''),
        summary: sections.summary || '',
        rawText: text
      };

      return parsedData;
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw error;
    }
  }

  extractSections(text) {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for section headers
      const lowerLine = trimmedLine.toLowerCase();
      if (this.isSectionHeader(lowerLine)) {
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = this.getSectionName(lowerLine);
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // Add the last section
    if (currentSection) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  }

  isSectionHeader(line) {
    const headers = [
      'education', 'experience', 'work experience', 'employment',
      'skills', 'technical skills', 'competencies',
      'summary', 'objective', 'profile',
      'personal', 'contact', 'personal information'
    ];

    return headers.some(header => line.includes(header));
  }

  getSectionName(line) {
    if (line.includes('education')) return 'education';
    if (line.includes('experience') || line.includes('employment')) return 'experience';
    if (line.includes('skills') || line.includes('competencies')) return 'skills';
    if (line.includes('summary') || line.includes('objective') || line.includes('profile')) return 'summary';
    if (line.includes('personal') || line.includes('contact')) return 'personal';
    return 'other';
  }

  extractPersonalInfo(text) {
    const info = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: ''
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails) info.email = emails[0];

    // Extract phone
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones) info.phone = phones[0];

    // Extract LinkedIn
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/g;
    const linkedins = text.match(linkedinRegex);
    if (linkedins) info.linkedin = linkedins[0];

    // Extract GitHub
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-]+/g;
    const githubs = text.match(githubRegex);
    if (githubs) info.github = githubs[0];

    return info;
  }

  extractEducation(text) {
    const education = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for degree patterns
      const degreePatterns = [
        /bachelor|master|phd|doctorate|associate|diploma|certificate/i,
        /university|college|institute|school/i
      ];

      if (degreePatterns.some(pattern => pattern.test(trimmedLine))) {
        education.push({
          institution: this.extractInstitution(trimmedLine),
          degree: this.extractDegree(trimmedLine),
          year: this.extractYear(trimmedLine)
        });
      }
    }

    return education;
  }

  extractExperience(text) {
    const experience = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Look for job title patterns
      const jobPatterns = [
        /engineer|developer|manager|analyst|consultant|specialist/i,
        /lead|senior|junior|principal|staff/i
      ];

      if (jobPatterns.some(pattern => pattern.test(line))) {
        const job = {
          title: this.extractJobTitle(line),
          company: this.extractCompany(line),
          duration: this.extractDuration(line),
          description: this.extractDescription(lines, i)
        };
        experience.push(job);
      }
    }

    return experience;
  }

  extractSkills(text) {
    const skills = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Split by common delimiters
      const skillParts = trimmedLine.split(/[,;|•]/);
      
      for (const part of skillParts) {
        const skill = part.trim();
        if (skill && skill.length > 1) {
          skills.push({
            name: skill,
            level: this.assessSkillLevel(skill),
            category: this.categorizeSkill(skill)
          });
        }
      }
    }

    return skills;
  }

  extractInstitution(text) {
    // Simple extraction - could be improved with NLP
    const words = text.split(' ');
    return words.slice(0, 3).join(' '); // First 3 words as institution
  }

  extractDegree(text) {
    const degreePatterns = [
      /bachelor|master|phd|doctorate|associate|diploma|certificate/i
    ];
    
    for (const pattern of degreePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    
    return '';
  }

  extractYear(text) {
    const yearPattern = /\b(19|20)\d{2}\b/;
    const match = text.match(yearPattern);
    return match ? match[0] : '';
  }

  extractJobTitle(text) {
    const words = text.split(' ');
    return words.slice(0, 3).join(' '); // First 3 words as title
  }

  extractCompany(text) {
    // Simple extraction - could be improved
    return text.split(' at ')[1] || text.split(' - ')[1] || '';
  }

  extractDuration(text) {
    const durationPattern = /\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\s*[-–]\s*present\b/i;
    const match = text.match(durationPattern);
    return match ? match[0] : '';
  }

  extractDescription(lines, startIndex) {
    let description = '';
    let i = startIndex + 1;
    
    while (i < lines.length && lines[i].trim() && !this.isSectionHeader(lines[i].toLowerCase())) {
      description += lines[i].trim() + ' ';
      i++;
    }
    
    return description.trim();
  }

  assessSkillLevel(skill) {
    // Simple assessment - could be improved with ML
    const advancedKeywords = ['expert', 'advanced', 'senior', 'lead'];
    const intermediateKeywords = ['intermediate', 'proficient', 'experienced'];
    
    const lowerSkill = skill.toLowerCase();
    
    if (advancedKeywords.some(keyword => lowerSkill.includes(keyword))) {
      return 'advanced';
    } else if (intermediateKeywords.some(keyword => lowerSkill.includes(keyword))) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  categorizeSkill(skill) {
    const categories = {
      programming: ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust'],
      frontend: ['html', 'css', 'react', 'vue', 'angular', 'svelte'],
      backend: ['node.js', 'express', 'django', 'flask', 'spring', 'asp.net'],
      database: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
      tools: ['git', 'jenkins', 'jira', 'confluence', 'figma']
    };

    const lowerSkill = skill.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerSkill.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }
}

module.exports = ResumeParser;
