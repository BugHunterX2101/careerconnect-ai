/**
 * Utility functions for sanitizing user input before logging
 * Prevents log injection attacks
 */

/**
 * Sanitize user input for logging
 * @param {any} input - Input to sanitize
 * @returns {string} - Sanitized string safe for logging
 */
function sanitizeForLog(input) {
  if (input === null || input === undefined) {
    return 'null';
  }
  
  // Convert to string and sanitize
  const str = String(input);
  
  // Remove or escape potentially dangerous characters
  return str
    .replace(/[\r\n]/g, ' ') // Replace newlines with spaces
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize object for logging
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
function sanitizeObjectForLog(obj) {
  if (!obj || typeof obj !== 'object') {
    return sanitizeForLog(obj);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeForLog(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObjectForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = {
  sanitizeForLog,
  sanitizeObjectForLog
};