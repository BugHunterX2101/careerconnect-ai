let use = null;
try {
  require('@tensorflow/tfjs-node');
} catch (error) {
  try {
    require('@tensorflow/tfjs');
  } catch (_) {
    // If TensorFlow runtime cannot be loaded, service continues with heuristic parsing.
  }
}

try {
  use = require('@tensorflow-models/universal-sentence-encoder');
} catch (error) {
  // Model package unavailable; fallback mode still supports non-embedding features.
  use = null;
}
const natural = require('natural');
const cache = require('./bertCacheService');

class BERTResumeService {
  constructor() {
    this.model = null;
    this.tokenizer = new natural.WordTokenizer();
    this.modelLoading = null;
  }

  async initializeModel() {
    if (this.modelLoading) return this.modelLoading;
    
    this.modelLoading = (async () => {
      try {
        if (!use) {
          this.model = null;
          console.warn('Universal Sentence Encoder not available, using heuristic parsing fallback');
          return;
        }
        this.model = await use.load();
        console.log('✓ Universal Sentence Encoder loaded');
      } catch (error) {
        console.error('USE model loading failed:', error.message);
        this.model = null;
      }
    })();
    
    return this.modelLoading;
  }

  async parseResumeWithBERT(resumeText) {
    const cached = await cache.get(resumeText);
    if (cached) return cached;
    
    if (!this.model) await this.initializeModel();

    const sections = this.extractSections(resumeText);
    const embeddings = await this.generateEmbeddings(sections);
    
    const result = {
      skills: await this.extractSkillsWithBERT(sections.skills, embeddings.skills),
      experience: this.extractExperience(sections.experience),
      education: this.extractEducation(sections.education),
      summary: sections.summary,
      embeddings: embeddings
    };
    
    await cache.set(resumeText, result);
    return result;
  }

  getModelStatus() {
    if (this.model) return 'ready';
    if (this.modelLoading) return 'loading';
    return 'idle';
  }

  extractSections(text) {
    const sections = {
      skills: '',
      experience: '',
      education: '',
      summary: ''
    };

    const skillsMatch = text.match(/(?:skills|technical skills|competencies)[:\s]+([\s\S]*?)(?=\n\n|experience|education|$)/i);
    const expMatch = text.match(/(?:experience|work history|employment)[:\s]+([\s\S]*?)(?=\n\n|education|skills|$)/i);
    const eduMatch = text.match(/(?:education|academic)[:\s]+([\s\S]*?)(?=\n\n|experience|skills|$)/i);
    const summaryMatch = text.match(/(?:summary|objective|profile)[:\s]+([\s\S]*?)(?=\n\n|experience|skills|education|$)/i);

    sections.skills = skillsMatch ? skillsMatch[1].trim() : '';
    sections.experience = expMatch ? expMatch[1].trim() : '';
    sections.education = eduMatch ? eduMatch[1].trim() : '';
    sections.summary = summaryMatch ? summaryMatch[1].trim() : text.substring(0, 500);

    return sections;
  }

  async generateEmbeddings(sections) {
    if (!this.model) return {};

    try {
      const embeddings = {};
      for (const [key, text] of Object.entries(sections)) {
        if (text) {
          const embedding = await this.model.embed([text]);
          embeddings[key] = await embedding.array();
          embedding.dispose();
        }
      }
      return embeddings;
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      return {};
    }
  }

  async extractSkillsWithBERT(skillsText, embedding) {
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'typescript', 'aws', 'docker',
      'kubernetes', 'sql', 'mongodb', 'git', 'ci/cd', 'agile', 'rest api', 'graphql',
      'machine learning', 'tensorflow', 'pytorch', 'data science', 'cloud', 'azure', 'gcp'
    ];

    const normalizedText = String(skillsText || '').toLowerCase();
    const tokens = this.tokenizer
      .tokenize(normalizedText)
      .map((token) => token.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/gi, ''))
      .filter((token) => token.length > 1);

    const hasSkillPhrase = (skill) => {
      const escaped = String(skill)
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+');
      const boundaryPattern = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i');
      return boundaryPattern.test(normalizedText);
    };

    const foundSkills = techSkills.filter((skill) => hasSkillPhrase(skill));

    return {
      technical: foundSkills,
      all: tokens.filter(t => t.length > 2),
      embedding: embedding
    };
  }

  extractExperience(expText) {
    const positions = [];
    const lines = expText.split('\n').filter(l => l.trim());
    
    let current = null;
    for (const line of lines) {
      const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch && (line.length < 100)) {
        if (current) positions.push(current);
        current = { title: line, years: yearMatch[0], description: '' };
      } else if (current) {
        current.description += line + ' ';
      }
    }
    if (current) positions.push(current);

    return { positions, totalYears: this.calculateYears(positions) };
  }

  extractEducation(eduText) {
    const degrees = [];
    const degreePatterns = ['bachelor', 'master', 'phd', 'associate', 'doctorate', 'b.s.', 'm.s.', 'b.a.', 'm.a.'];
    
    degreePatterns.forEach(pattern => {
      if (eduText.toLowerCase().includes(pattern)) {
        degrees.push(pattern);
      }
    });

    return { degrees, raw: eduText };
  }

  calculateYears(positions) {
    if (!positions.length) return 0;
    const years = positions.map(p => parseInt(p.years)).filter(y => !isNaN(y));
    return years.length ? new Date().getFullYear() - Math.min(...years) : 0;
  }

  async calculateSimilarity(text1, text2) {
    if (!this.model) await this.initializeModel();
    
    try {
      const embeddings = await this.model.embed([text1, text2]);
      const embeddingsArray = await embeddings.array();
      const similarity = this.cosineSimilarity(embeddingsArray[0], embeddingsArray[1]);
      embeddings.dispose();
      return similarity;
    } catch (error) {
      console.error('Similarity calculation failed:', error.message);
      return 0;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

module.exports = new BERTResumeService();
