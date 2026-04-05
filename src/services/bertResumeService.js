/**
 * BERTResumeService
 * -----------------
 * Uses a real BERT model (bert-base-uncased via @xenova/transformers) to
 * semantically embed resume text and extract structured data.
 *
 * Key capabilities:
 *  1. Semantic section detection  - BERT CLS-token cosine similarity against
 *     section-label anchors rather than brittle regex.
 *  2. Skill extraction with confidence - each detected skill is scored by
 *     semantic proximity to the skills section embedding.
 *  3. Experience / education structured parsing.
 *  4. Job-description <-> resume similarity scoring for matching.
 *  5. Graceful degradation - all paths work (heuristically) when the BERT model
 *     is unavailable (no network / cold environment).
 *
 * Model: Xenova/bert-base-uncased  (ONNX-quantised, runs in Node via ONNX Runtime)
 * Library: @xenova/transformers ^2.x - HuggingFace Transformers for JS
 */

// --- BERT via @xenova/transformers (ONNX Runtime, no Python required) ---
// @xenova/transformers is ESM-only; dynamic import lets CJS callers use it.
let _xenovaModule = null;

async function _loadXenova() {
  if (_xenovaModule) return _xenovaModule;
  try {
    _xenovaModule = await import('@xenova/transformers');
    // Cache downloaded model weights locally so the server doesn't re-download on restart
    if (_xenovaModule.env) {
      _xenovaModule.env.cacheDir = require('path').join(__dirname, '../../.model_cache');
      _xenovaModule.env.allowRemoteModels = true;
    }
    return _xenovaModule;
  } catch (err) {
    console.warn('[BERT] @xenova/transformers unavailable:', err.message);
    return null;
  }
}

const natural = require('natural');
const cache = require('./bertCacheService');

// ---------------------------------------------------------------------------
// Comprehensive skill taxonomy
// ---------------------------------------------------------------------------
const SKILL_TAXONOMY = {
  languages:     ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'bash', 'perl'],
  frontend:      ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'tailwind', 'webpack', 'vite', 'next.js', 'nuxt', 'gatsby'],
  backend:       ['node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'nestjs', 'graphql', 'rest api', 'grpc'],
  databases:     ['postgresql', 'mysql', 'mongodb', 'sqlite', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'oracle', 'sql server', 'firebase'],
  cloud:         ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'cloudflare'],
  devops:        ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd', 'helm', 'prometheus', 'grafana'],
  ml:            ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'hugging face', 'llm', 'nlp', 'computer vision', 'data science', 'pandas', 'numpy'],
  mobile:        ['ios', 'android', 'react native', 'flutter', 'swiftui', 'xcode'],
  security:      ['cybersecurity', 'oauth', 'jwt', 'ssl/tls', 'penetration testing', 'siem', 'soc'],
  practices:     ['agile', 'scrum', 'kanban', 'tdd', 'bdd', 'microservices', 'design patterns', 'clean architecture', 'ddd']
};

const ALL_SKILLS = Object.values(SKILL_TAXONOMY).flat();

// Section label anchors - BERT embeds these and compares to every paragraph
const SECTION_ANCHORS = {
  summary:    ['professional summary', 'objective', 'about me', 'profile', 'career overview'],
  skills:     ['technical skills', 'core competencies', 'skills', 'technologies', 'tools and technologies'],
  experience: ['work experience', 'professional experience', 'employment history', 'career history', 'work history'],
  education:  ['education', 'academic background', 'qualifications', 'degrees', 'certifications']
};

// ---------------------------------------------------------------------------

class BERTResumeService {
  constructor() {
    this.extractor = null;       // @xenova/transformers feature-extraction pipeline
    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
    this.modelLoading = null;    // singleton promise
    this._anchorEmbeddings = {}; // precomputed { section: number[][] }
    this.modelName = 'Xenova/bert-base-uncased';
  }

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  async initializeModel() {
    if (this.modelLoading) return this.modelLoading;

    this.modelLoading = (async () => {
      const xenova = await _loadXenova();
      if (!xenova) {
        console.warn('[BERT] Running in heuristic-only mode (no BERT model)');
        return;
      }
      try {
        // feature-extraction returns per-token + CLS embeddings from real BERT
        this.extractor = await xenova.pipeline(
          'feature-extraction',
          this.modelName,
          { quantized: true } // ONNX int8-quantised weights (~25 MB vs 420 MB fp32)
        );
        console.log('[BERT] Model loaded: ' + this.modelName + ' (quantized ONNX)');
        await this._precomputeAnchors();
        console.log('[BERT] Section anchors precomputed');
      } catch (err) {
        console.error('[BERT] Model loading failed - heuristic fallback active:', err.message);
        this.extractor = null;
      }
    })();

    return this.modelLoading;
  }

  /**
   * Embed a single string with BERT and return its CLS vector (dim 768).
   * The [CLS] token gives a sentence-level representation - ideal for similarity.
   */
  async _embed(text) {
    if (!this.extractor) return null;
    try {
      const output = await this.extractor(text, { pooling: 'cls', normalize: true });
      return Array.from(output.data);
    } catch (err) {
      console.error('[BERT] embed error:', err.message);
      return null;
    }
  }

  /**
   * Batch-embed multiple strings sequentially.
   * @xenova/transformers handles tokenisation + ONNX inference internally.
   */
  async _embedBatch(texts) {
    if (!this.extractor || !texts.length) return texts.map(() => null);
    const results = await Promise.all(texts.map(t => this._embed(t)));
    return results;
  }

  async _precomputeAnchors() {
    if (!this.extractor) return;
    for (const [section, labels] of Object.entries(SECTION_ANCHORS)) {
      try {
        const embeddings = await this._embedBatch(labels);
        this._anchorEmbeddings[section] = embeddings.filter(Boolean);
      } catch (_) { /* ignore */ }
    }
  }

  getModelStatus() {
    if (this.extractor) return 'ready';
    if (this.modelLoading) return 'loading';
    return 'idle';
  }

  // -------------------------------------------------------------------------
  // Main public API
  // -------------------------------------------------------------------------

  async parseResumeWithBERT(resumeText) {
    const cached = await cache.get(resumeText);
    if (cached) return cached;

    if (this.modelLoading) await this.modelLoading;
    if (!this.extractor && !this.modelLoading) await this.initializeModel();

    const sections = this.extractor
      ? await this._detectSectionsWithBERT(resumeText)
      : this._detectSectionsHeuristic(resumeText);

    const [skills, experience, education, personalInfo] = await Promise.all([
      this._extractSkillsWithBERT(sections.skills, sections.full),
      this._extractExperience(sections.experience),
      this._extractEducation(sections.education),
      this._extractPersonalInfo(sections.full)
    ]);

    // Full-resume CLS embedding for downstream job matching
    // BERT max context is 512 tokens; slice prose conservatively
    let resumeEmbedding = null;
    if (this.extractor) {
      resumeEmbedding = await this._embed(resumeText.slice(0, 512));
    }

    const qualityScore = this._computeQualityScore({ skills, experience, education, personalInfo, summary: sections.summary });

    const result = {
      personalInfo,
      summary: sections.summary,
      skills,
      experience,
      education,
      qualityScore,
      resumeEmbedding,
      parsingMethod: this.extractor ? 'bert-base-uncased' : 'heuristic',
      modelName: this.extractor ? this.modelName : null,
      parsedAt: new Date().toISOString()
    };

    if ((result.skills?.all?.length || 0) > 0 || (result.experience?.positions?.length || 0) > 0) {
      await cache.set(resumeText, result);
    }
    return result;
  }

  async computeJobMatch(resumeText, jobDescriptionText) {
    if (!this.extractor) await this.initializeModel();
    if (!this.extractor) return this._heuristicJobMatch(resumeText, jobDescriptionText);

    try {
      const [resumeVec, jobVec] = await this._embedBatch([
        resumeText.slice(0, 512),
        jobDescriptionText.slice(0, 512)
      ]);
      if (!resumeVec || !jobVec) return this._heuristicJobMatch(resumeText, jobDescriptionText);
      return this._cosineSimilarity(resumeVec, jobVec);
    } catch (err) {
      console.error('[BERT] Job match error:', err.message);
      return this._heuristicJobMatch(resumeText, jobDescriptionText);
    }
  }

  // -------------------------------------------------------------------------
  // Section detection
  // -------------------------------------------------------------------------

  async _detectSectionsWithBERT(text) {
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (!paragraphs.length) return this._detectSectionsHeuristic(text);

    const sectionContent = { summary: '', skills: '', experience: '', education: '', full: text };

    try {
      const paraVecs = await this._embedBatch(
        paragraphs.map(p => p.slice(0, 256))
      );

      paragraphs.forEach((para, i) => {
        if (!paraVecs[i]) return;
        let bestSection = null;
        let bestScore = 0.30; // cosine similarity threshold

        for (const [section, anchors] of Object.entries(this._anchorEmbeddings)) {
          const maxSim = Math.max(...anchors.map(anchor => this._cosineSimilarity(paraVecs[i], anchor)));
          if (maxSim > bestScore) { bestScore = maxSim; bestSection = section; }
        }

        if (bestSection) sectionContent[bestSection] += para + '\n\n';
        else if (!sectionContent.summary) sectionContent.summary += para + '\n';
      });
    } catch (err) {
      console.error('[BERT] Section detection failed, using heuristic:', err.message);
      return this._detectSectionsHeuristic(text);
    }

    return sectionContent;
  }

  _detectSectionsHeuristic(text) {
    const lines = text.split('\n');
    const sections = { summary: '', skills: '', experience: '', education: '', full: text };
    let current = 'summary';
    const HEADER_RE = {
      summary:    /^(summary|objective|profile|about|overview)/i,
      skills:     /^(skills|technologies|competencies|tools)/i,
      experience: /^(experience|employment|work\s+history|career)/i,
      education:  /^(education|academic|degrees?|qualifications?)/i
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let matched = false;
      for (const [sec, re] of Object.entries(HEADER_RE)) {
        if (re.test(trimmed) && trimmed.length < 50) { current = sec; matched = true; break; }
      }
      if (!matched) sections[current] += line + '\n';
    }
    if (!sections.skills && !sections.experience) {
      sections.skills = text;
      sections.experience = text;
    }
    return sections;
  }

  // -------------------------------------------------------------------------
  // Skill extraction
  // -------------------------------------------------------------------------

  async _extractSkillsWithBERT(skillsText, fullText) {
    const haystack = (skillsText || fullText || '').toLowerCase();

    // 1. Keyword baseline (always runs)
    const foundSkills = {};
    for (const skill of ALL_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const re = new RegExp('(^|[^a-z0-9+#.])' + escaped + '([^a-z0-9+#.]|$)', 'i');
      if (re.test(haystack)) {
        foundSkills[skill] = { name: skill, confidence: 0.85, source: 'keyword' };
      }
    }

    // 2. BERT semantic boost - score each found skill vs the skills section
    if (this.extractor && skillsText && skillsText.length > 10) {
      try {
        const skillNames = Object.keys(foundSkills);
        if (skillNames.length > 0) {
          const sectionVec = await this._embed(skillsText.slice(0, 256));
          if (sectionVec) {
            const skillVecs = await this._embedBatch(skillNames);
            skillNames.forEach((skill, i) => {
              if (!skillVecs[i]) return;
              const sim = this._cosineSimilarity(sectionVec, skillVecs[i]);
              foundSkills[skill].confidence = Math.min(0.99, 0.5 + sim * 0.5);
              foundSkills[skill].source = 'bert-base-uncased';
            });
          }
        }

        // Semantic scan for skills not caught by keyword matching
        const sentences = this.sentenceTokenizer.tokenize(skillsText).slice(0, 20);
        if (sentences.length > 0) {
          const sentVecs = await this._embedBatch(sentences.map(s => s.slice(0, 128)));
          const candidateSkills = ALL_SKILLS.slice(0, 50).filter(s => !foundSkills[s]);
          if (candidateSkills.length > 0) {
            const skillVecs = await this._embedBatch(candidateSkills);
            sentences.forEach((_, si) => {
              if (!sentVecs[si]) return;
              candidateSkills.forEach((skill, ki) => {
                if (!skillVecs[ki]) return;
                const sim = this._cosineSimilarity(sentVecs[si], skillVecs[ki]);
                if (sim > 0.75) {
                  foundSkills[skill] = { name: skill, confidence: sim, source: 'bert-semantic' };
                }
              });
            });
          }
        }
      } catch (err) {
        console.error('[BERT] Skill embedding error:', err.message);
      }
    }

    const categorised = {};
    for (const [cat, catSkills] of Object.entries(SKILL_TAXONOMY)) {
      const hits = catSkills.filter(s => foundSkills[s]);
      if (hits.length) categorised[cat] = hits;
    }

    return {
      all: Object.values(foundSkills).sort((a, b) => b.confidence - a.confidence),
      categorised,
      count: Object.keys(foundSkills).length
    };
  }

  // -------------------------------------------------------------------------
  // Experience extraction
  // -------------------------------------------------------------------------

  _extractExperience(expText) {
    const positions = [];
    if (!expText) return { positions, totalYears: 0 };

    const lines = expText.split('\n').map(l => l.trim()).filter(Boolean);
    let current = null;
    const DATE_RE = /\b(20\d{2}|19\d{2})\b/;
    const MONTH_YEAR_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.-]+(20\d{2}|19\d{2})\b/i;

    for (const line of lines) {
      const hasYear = DATE_RE.test(line);
      const isHeader = hasYear || MONTH_YEAR_RE.test(line);

      if (isHeader && line.length < 120) {
        if (current) positions.push(current);
        current = {
          title: line,
          years: (line.match(DATE_RE) || [])[0] || null,
          description: '',
          bullets: []
        };
      } else if (current) {
        if (line.startsWith('\u2022') || line.startsWith('-') || line.startsWith('*')) {
          current.bullets.push(line.replace(/^[\u2022\-*]\s*/, ''));
        } else {
          current.description += line + ' ';
        }
      }
    }
    if (current) positions.push(current);

    const years = positions.map(p => parseInt(p.years, 10)).filter(y => !isNaN(y));
    const totalYears = years.length ? new Date().getFullYear() - Math.min(...years) : 0;

    return { positions, totalYears };
  }

  // -------------------------------------------------------------------------
  // Education extraction
  // -------------------------------------------------------------------------

  _extractEducation(eduText) {
    if (!eduText) return { degrees: [], institutions: [], raw: '' };

    const DEGREE_PATTERNS = [
      { re: /\b(ph\.?d\.?|doctor(?:ate)?)\b/i, level: 'phd' },
      { re: /\b(m\.?s\.?|m\.?sc\.?|master['s]*\s+(?:of\s+)?(?:science|arts|engineering|business))\b/i, level: 'masters' },
      { re: /\b(m\.?b\.?a\.?)\b/i, level: 'mba' },
      { re: /\b(b\.?s\.?|b\.?sc\.?|b\.?e\.?|b\.?tech\.?|bachelor['s]*\s+(?:of\s+)?(?:science|arts|engineering|technology))\b/i, level: 'bachelors' },
      { re: /\b(b\.?a\.?|bachelor['s]*\s+of\s+arts)\b/i, level: 'bachelors' },
      { re: /\bassociate['s]*\b/i, level: 'associate' }
    ];

    const degrees = [];
    const lines = eduText.split('\n').filter(l => l.trim());
    for (const line of lines) {
      for (const { re, level } of DEGREE_PATTERNS) {
        if (re.test(line)) {
          const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
          degrees.push({ level, raw: line.trim(), year: yearMatch ? yearMatch[0] : null });
          break;
        }
      }
    }

    const INST_RE = /\b(university|college|institute|school|academy)\b/i;
    const institutions = lines
      .filter(l => INST_RE.test(l))
      .map(l => l.trim())
      .slice(0, 5);

    return { degrees, institutions, raw: eduText };
  }

  // -------------------------------------------------------------------------
  // Personal info extraction
  // -------------------------------------------------------------------------

  _extractPersonalInfo(text) {
    const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/;
    const LINKEDIN_RE = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i;
    const GITHUB_RE = /github\.com\/([a-zA-Z0-9-]+)/i;
    const URL_RE = /https?:\/\/[^\s]+/gi;
    const NAME_RE = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/m;
    const lm = text.match(LINKEDIN_RE);
    const gm = text.match(GITHUB_RE);
    return {
      fullName:  (text.match(NAME_RE) || [])[1]?.trim() || null,
      email:     (text.match(EMAIL_RE) || [])[0] || null,
      phone:     (text.match(PHONE_RE) || [])[1]?.trim() || null,
      linkedin:  lm ? 'https://linkedin.com/in/' + lm[1] : null,
      github:    gm ? 'https://github.com/' + gm[1] : null,
      websites:  (text.match(URL_RE) || []).filter(u => !u.includes('linkedin') && !u.includes('github')).slice(0, 3)
    };
  }

  // -------------------------------------------------------------------------
  // Quality scoring
  // -------------------------------------------------------------------------

  _computeQualityScore({ skills, experience, education, personalInfo, summary }) {
    let score = 0;
    const breakdown = {};

    let contact = 0;
    if (personalInfo?.email) contact += 10;
    if (personalInfo?.phone) contact += 5;
    if (personalInfo?.linkedin) contact += 3;
    if (personalInfo?.github) contact += 2;
    breakdown.contact = contact;
    score += contact;

    const summaryScore = summary && summary.length > 50 ? 10 : summary && summary.length > 20 ? 5 : 0;
    breakdown.summary = summaryScore;
    score += summaryScore;

    const skillScore = Math.min(30, (skills?.count || 0) * 2);
    breakdown.skills = skillScore;
    score += skillScore;

    const expScore = Math.min(30, (experience?.positions?.length || 0) * 10);
    breakdown.experience = expScore;
    score += expScore;

    const eduScore = (education?.degrees?.length || 0) > 0 ? 10 : 0;
    breakdown.education = eduScore;
    score += eduScore;

    return { total: Math.min(100, score), breakdown, grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D' };
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] ** 2;
      magB += vecB[i] ** 2;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  _heuristicJobMatch(resumeText, jobText) {
    const resumeWords = new Set(this.tokenizer.tokenize(resumeText.toLowerCase()));
    const jobWords = this.tokenizer.tokenize(jobText.toLowerCase());
    const matches = jobWords.filter(w => resumeWords.has(w) && w.length > 3).length;
    return Math.min(1, matches / Math.max(jobWords.length, 1));
  }

  async analyzeResumeQuality(parsedData) {
    return this._computeQualityScore({
      skills: parsedData.skills,
      experience: parsedData.experience,
      education: parsedData.education,
      personalInfo: parsedData.personalInfo,
      summary: parsedData.summary
    });
  }

  // Alias used by skillGapAnalysisService
  async calculateSimilarity(textA, textB) {
    return this.computeJobMatch(textA, textB);
  }
}

module.exports = new BERTResumeService();
