const makeAIRequest = async (requestFn, fallbackResponse = null, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.error(`AI request attempt ${i + 1} failed:`, error.message);

      if (error.status === 401 || error.status === 403) {
        throw new Error('AI API authentication failed');
      }

      if (error.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (error.status === 400) {
        throw new Error('Invalid AI request: ' + error.message);
      }

      if (i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (fallbackResponse !== null) {
    console.warn('AI request failed, using fallback response');
    return fallbackResponse;
  }

  throw new Error(`AI request failed after ${maxRetries} attempts: ${lastError.message}`);
};

module.exports = { makeAIRequest };
