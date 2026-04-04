/**
 * ResumeParser
 * ------------
 * Thin orchestration layer:
 *  1. Reads the file (PDF → text via pdf-parse, TXT → plain read)
 *  2. Delegates all NLP/BERT work to BERTResumeService
 *  3. Validates the file path against the allowed upload directory to
 *     prevent path-traversal attacks (fixed bug #3)
 */

const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const bertResumeService = require('../services/bertResumeService');

// Allowed base directories (resolved to absolute paths at module load time)
const ALLOWED_DIRS = [
  path.resolve(__dirname, '../../uploads'),
  os.tmpdir()
];

class ResumeParser {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    await bertResumeService.initializeModel();
    this.isInitialized = true;
    console.log('[ResumeParser] initialized (BERT backend:', bertResumeService.getModelStatus(), ')');
  }

  /**
   * Parse a resume file and return structured data.
   * @param {string} filePath — absolute path to the uploaded resume
   */
  async parseResume(filePath) {
    if (!this.isInitialized) await this.initialize();

    // --- Path-traversal guard (fix for bug #3) ---
    const resolved = path.resolve(filePath);
    const allowed = ALLOWED_DIRS.some(dir => resolved.startsWith(dir + path.sep) || resolved.startsWith(dir));
    if (!allowed) throw new Error('Invalid file path — access denied');

    // --- Extract text ---
    const ext = path.extname(resolved).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      const buf = await fs.readFile(resolved);
      const data = await pdfParse(buf);
      text = data.text || '';
    } else if (ext === '.txt') {
      text = await fs.readFile(resolved, 'utf8');
    } else {
      throw new Error(`Unsupported file format: ${ext}. Please upload a PDF or TXT file.`);
    }

    if (!text.trim()) throw new Error('Resume appears to be empty or could not be read');

    // --- BERT parsing ---
    const parsed = await bertResumeService.parseResumeWithBERT(text);
    return parsed;
  }

  /** Analyse resume quality — delegates to bertResumeService */
  async analyzeResumeQuality(parsedData) {
    return bertResumeService.analyzeResumeQuality(parsedData);
  }

  /** Compute similarity between a resume and a job description */
  async computeJobMatch(resumeText, jobDescriptionText) {
    return bertResumeService.computeJobMatch(resumeText, jobDescriptionText);
  }
}

module.exports = ResumeParser;
