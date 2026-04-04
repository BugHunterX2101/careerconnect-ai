/**
 * BERTResumeService
 * -----------------
 * Uses Google's Universal Sentence Encoder (USE) — a BERT-class transformer
 * model — to semantically embed resume text and extract structured data.
 *
 * Key capabilities:
 *  1. Semantic section detection  — USE cosine similarity against section-label
 *     anchors rather than brittle regex.
 *  2. Skill extraction with confidence — each detected skill is scored by
 *     semantic proximity to the skills section embedding.
 *  3. Experience / education structured parsing.
 *  4. Job-description ↔ resume similarity scoring for matching.
 *  5. Graceful degradation — all paths work (heuristically) when TF/USE are
 *     unavailable (no GPU/WASM environment).
 */

// --- TensorFlow runtime (try native bindings first, then WASM, then skip) ---
let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (_) {
  try { tf = require('@tensorflow/tfjs'); } catch (__) { /* no TF at all */ }
}

let use = null;
try {
  use = require('@tensorflow-models/universal-sentence-encoder');
} catch (_) { /* package not installed */ }

const natural = require('natural');
const cache = require('./bertCacheService');

// ---------------------------------------------------------------------------
// Comprehensive skill taxonomy — used both for heuristic and USE-based extraction
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

// Section label anchors — USE will embed these and compare to every paragraph
const SECTION_ANCHORS = {
  summary:    ['professional summary', 'objective', 'about me', 'profile', 'career overview'],
  skills:     ['technical skills', 'core competencies', 'skills', 'technologies', 'tools and technologies'],
  experience: ['work experience', 'professional experience', 'employment history', 'career history', 'work history'],
  education:  ['education', 'academic background', 'qualifications', 'degrees', 'certifications']
};

// ---------------------------------------------------------------------------

class BERTResumeService {
  constructor() {
    this.model = null;           // USE model instance
    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
    this.modelLoading = null;    // singleton promise
    this._anchorEmbeddings = {}; // precomputed {section: Float32Array[]}
  }

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  async initializeModel() {
    if (this.modelLoading) return this.modelLoading;

    this.modelLoading = (async () => {
      if (!tf || !use) {
        console.warn('[BERT] TensorFlow/USE not available — heuristic-only mode');
        return;
      }
      try {
        await tf.ready();
        this.model = await use.load();
        console.log('✓ [BERT] Universal Sentence Encoder loaded');
        // Precompute anchor embeddings for fast section detection
        await this._precomputeAnchors();
        console.log('✓ [BERT] Section anchors precomputed');
      } catch (err) {
        console.error('[BERT] Model loading failed — heuristic fallback:', err.message);
        this.model = null;
      }
    })();

    return this.modelLoading;
  }

  async _precomputeAnchors() {
    if (!this.model) return;
    for (const [section, labels] of Object.entries(SECTION_ANCHORS)) {
      try {
        const emb = await this.model.embed(labels);
        this._anchorEmbeddings[section] = await emb.array(); // [[512 floats], ...]
        emb.dispose();
      } catch (_) { /* ignore */ }
    }
  }

  getModelStatus() {
    if (this.model) return 'ready';
    if (this.modelLoading) return 'loading';
    return 'idle';
  }

  // -------------------------------------------------------------------------
  // Main public API
  // -------------------------------------------------------------------------

  /**
   * Parse a resume text and return rich structured data.
   * Results are cached by SHA-256 hash of the input text.
   */
  async parseResumeWithBERT(resumeText) {
    const cached = await cache.get(resumeText);
    if (cached) return cached;

    // Wait for any in-progress model load before proceeding
    if (this.modelLoading) await this.modelLoading;
    if (!this.model && !this.modelLoading) await this.initializeModel();

    const sections = this.model
      ? await this._detectSectionsWithBERT(resumeText)
      : this._detectSectionsHeuristic(resumeText);

    const [skills, experience, education, personalInfo] = await Promise.all([
      this._extractSkillsWithBERT(sections.skills, sections.full),
      this._extractExperience(sections.experience),
      this._extractEducation(sections.education),
      this._extractPersonalInfo(sections.full)
    ]);

    // Compute an overall embedding for the whole resume (for job matching)
    let resumeEmbedding = null;
    if (this.model) {
      try {
        const embTensor = await this.model.embed([resumeText.slice(0, 2000)]);
        const arr = await embTensor.array();
        resumeEmbedding = arr[0];
        embTensor.dispose();
      } catch (_) { /* skip */ }
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
      parsingMethod: this.model ? 'bert-use' : 'heuristic',
      parsedAt: new Date().toISOString()
    };

    // Only cache if we actually extracted something useful
    if ((result.skills?.all?.length || 0) > 0 || (result.experience?.positions?.length || 0) > 0) {
      await cache.set(resumeText, result);
    }
    return result;
  }

  /**
   * Compute cosine similarity between a resume and a job description.
   * Returns a score between 0 and 1.
   */
  async computeJobMatch(resumeText, jobDescriptionText) {
    if (!this.model) await this.initializeModel();
    if (!this.model) return this._heuristicJobMatch(resumeText, jobDescriptionText);

    try {
      const texts = [
        resumeText.slice(0, 2000),
        jobDescriptionText.slice(0, 2000)
      ];
      const emb = await this.model.embed(texts);
      const arr = await emb.array();
      emb.dispose();
      return this._cosineSimilarity(arr[0], arr[1]);
    } catch (err) {
      console.error('[BERT] Job match error:', err.message);
      return this._heuristicJobMatch(resumeText, jobDescriptionText);
    }
  }

  // -------------------------------------------------------------------------
  // Section detection
  // -------------------------------------------------------------------------

  /**
   * Split resume text into sections by comparing paragraph embeddings to
   * precomputed section-label anchor embeddings using cosine similarity.
   */
  async _detectSectionsWithBERT(text) {
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (!paragraphs.length) return this._detectSectionsHeuristic(text);

    const sectionContent = { summary: '', skills: '', experience: '', education: '', full: text };

    try {
      const embTensor = await this.model.embed(paragraphs);
      const embArray = await embTensor.array(); // [[512], ...]
      embTensor.dispose();

      paragraphs.forEach((para, i) => {
        let bestSection = null;
        let bestScore = 0.35; // minimum similarity threshold

        for (const [section, anchors] of Object.entries(this._anchorEmbeddings)) {
          const maxSim = Math.max(...anchors.map(anchor => this._cosineSimilarity(embArray[i], anchor)));
          if (maxSim > bestScore) { bestScore = maxSim; bestSection = section; }
        }

        if (bestSection) sectionContent[bestSection] += para + '\n\n';
        else if (!sectionContent.summary) sectionContent.summary += para + '\n'; // First unmatched → summary
      });
    } catch (err) {
      console.error('[BERT] Section detection failed, using heuristic:', err.message);
      return this._detectSectionsHeuristic(text);
    }

    return sectionContent;
  }

  /** Fast regex-based section splitter (used when USE is unavailable) */
  _detectSectionsHeuristic(text) {
    const lower = text.toLowerCase();
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

    // If no sections detected, put everything in skills+experience for at least skill extraction
    if (!sections.skills && !sections.experience) {
      sections.skills = text;
      sections.experience = text;
    }

    return sections;
  }

  // -------------------------------------------------------------------------
  // Skill extraction
  // -------------------------------------------------------------------------

  /**
   * Extract skills with confidence scores.
   * With USE: each candidate skill embedding is compared to the skills section
   * embedding; only skills above a threshold are returned.
   * Without USE: straight keyword matching.
   */
  async _extractSkillsWithBERT(skillsText, fullText) {
    const haystack = (skillsText || fullText || '').toLowerCase();

    // 1. Keyword-based baseline (always runs)
    const foundSkills = {};
    for (const skill of ALL_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const re = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, 'i');
      if (re.test(haystack)) {
        foundSkills[skill] = { name: skill, confidence: 0.85, source: 'keyword' };
      }
    }

    // 2. USE semantic boost (when model available)
    if (this.model && skillsText && skillsText.length > 10) {
      try {
        const skillNames = Object.keys(foundSkills);
        if (skillNames.length > 0) {
          const texts = [skillsText.slice(0, 1000), ...skillNames];
          const emb = await this.model.embed(texts);
          const arr = await emb.array();
          emb.dispose();

          const sectionVec = arr[0];
          skillNames.forEach((skill, i) => {
            const sim = this._cosineSimilarity(sectionVec, arr[i + 1]);
            // Boost confidence based on semantic proximity
            foundSkills[skill].confidence = Math.min(0.99, 0.5 + sim * 0.5);
            foundSkills[skill].source = 'bert-use';
          });
        }

        // Also scan for unseen skills via sentence similarity on individual sentences
        const sentences = this.sentenceTokenizer.tokenize(skillsText).slice(0, 30);
        if (sentences.length > 0) {
          const sentEmb = await this.model.embed(sentences);
          const sentArr = await sentEmb.array();
          sentEmb.dispose();

          const skillEmb = await this.model.embed(ALL_SKILLS.slice(0, 50)); // batch
          const skillArr = await skillEmb.array();
          skillEmb.dispose();

          sentences.forEach((_, si) => {
            ALL_SKILLS.slice(0, 50).forEach((skill, ki) => {
              if (foundSkills[skill]) return; // already found
              const sim = this._cosineSimilarity(sentArr[si], skillArr[ki]);
              if (sim > 0.72) {
                foundSkills[skill] = { name: skill, confidence: sim, source: 'bert-semantic' };
              }
            });
          });
        }
      } catch (err) {
        console.error('[BERT] Skill embedding error:', err.message);
      }
    }

    // Categorise results
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
    const DURATION_RE = /\b(\d+)\s+year/i;

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
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          current.bullets.push(line.replace(/^[•\-*]\s*/, ''));
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

    // Extract institution names (lines with "University", "College", "Institute")
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

    const emailMatch = text.match(EMAIL_RE);
    const phoneMatch = text.match(PHONE_RE);
    const linkedinMatch = text.match(LINKEDIN_RE);
    const githubMatch = text.match(GITHUB_RE);

    // Name heuristic: first non-empty line that contains ≥2 capitalised words
    const NAME_RE = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/m;
    const nameMatch = text.match(NAME_RE);

    return {
      fullName: nameMatch ? nameMatch[1].trim() : null,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[1].trim() : null,
      linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : null,
      github: githubMatch ? `https://github.com/${githubMatch[1]}` : null,
      websites: (text.match(URL_RE) || []).filter(u => !u.includes('linkedin') && !u.includes('github')).slice(0, 3)
    };
  }

  // -------------------------------------------------------------------------
  // Quality scoring
  // -------------------------------------------------------------------------

  _computeQualityScore({ skills, experience, education, personalInfo, summary }) {
    let score = 0;
    const breakdown = {};

    // Contact info (20 pts)
    let contact = 0;
    if (personalInfo?.email) contact += 10;
    if (personalInfo?.phone) contact += 5;
    if (personalInfo?.linkedin) contact += 3;
    if (personalInfo?.github) contact += 2;
    breakdown.contact = contact;
    score += contact;

    // Summary (10 pts)
    const summaryScore = summary && summary.length > 50 ? 10 : summary && summary.length > 20 ? 5 : 0;
    breakdown.summary = summaryScore;
    score += summaryScore;

    // Skills (30 pts)
    const skillCount = skills?.count || 0;
    const skillScore = Math.min(30, skillCount * 2);
    breakdown.skills = skillScore;
    score += skillScore;

    // Experience (30 pts)
    const posCount = experience?.positions?.length || 0;
    const expScore = Math.min(30, posCount * 10);
    breakdown.experience = expScore;
    score += expScore;

    // Education (10 pts)
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

  // Analyse quality of a pre-parsed resume object (called from ML route)
  async analyzeResumeQuality(parsedData) {
    return this._computeQualityScore({
      skills: parsedData.skills,
      experience: parsedData.experience,
      education: parsedData.education,
      personalInfo: parsedData.personalInfo,
      summary: parsedData.summary
    });
  }
}

module.exports = new BERTResumeService();
