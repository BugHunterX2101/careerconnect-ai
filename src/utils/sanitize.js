// Log sanitization utility to prevent log injection
const sanitizeForLog = (input) => {
  if (typeof input === 'object') {
    try {
      return JSON.stringify(input).replace(/[\n\r\t]/g, ' ').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    } catch (error) {
      return String(input).replace(/[\n\r\t]/g, ' ').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    }
  }
  return String(input).replace(/[\n\r\t]/g, ' ').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
};

module.exports = { sanitizeForLog };