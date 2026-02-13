/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize input for logging to prevent log injection attacks
 * @param {any} input - Input to sanitize
 * @returns {string} - Sanitized input safe for logging
 */
const sanitizeForLog = (input) => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert to string and encode URI components to prevent injection
  const stringInput = String(input);
  return encodeURIComponent(stringInput);
};

/**
 * Sanitize object for logging
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object safe for logging
 */
const sanitizeObjectForLog = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return sanitizeForLog(obj);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeForLog(value);
  }
  return sanitized;
};

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} input - HTML input to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (input) => {
  if (!input) return '';
  
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  sanitizeForLog,
  sanitizeObjectForLog,
  sanitizeHtml
};