// Log sanitization utility to prevent log injection
/* eslint-disable no-control-regex */
const CONTROL_CHARS = /[\x00-\x1f\x7f-\x9f]/g;
/* eslint-enable no-control-regex */

const sanitizeForLog = (input) => {
  if (typeof input === 'object') {
    try {
      return JSON.stringify(input).replace(/[\n\r\t]/g, ' ').replace(CONTROL_CHARS, '');
    } catch (error) {
      return String(input).replace(/[\n\r\t]/g, ' ').replace(CONTROL_CHARS, '');
    }
  }
  return String(input).replace(/[\n\r\t]/g, ' ').replace(CONTROL_CHARS, '');
};

module.exports = { sanitizeForLog };
