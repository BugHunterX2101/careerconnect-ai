const bertResumeService = require('./bertResumeService');

class BERTPoolManager {
  constructor() {
    this.stats = {
      totalRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      lastError: null,
      lastRequestAt: null
    };
  }

  async parseResume(resumeText) {
    const start = Date.now();
    this.stats.totalRequests += 1;
    this.stats.lastRequestAt = new Date().toISOString();

    try {
      const result = await bertResumeService.parseResumeWithBERT(resumeText);
      const latency = Date.now() - start;
      this.stats.avgLatencyMs = this.calculateAvgLatency(latency);
      return result;
    } catch (error) {
      this.stats.failedRequests += 1;
      this.stats.lastError = error.message;
      throw error;
    }
  }

  async warmup() {
    const start = Date.now();
    try {
      await bertResumeService.initializeModel();
      return {
        ok: true,
        status: bertResumeService.getModelStatus(),
        latencyMs: Date.now() - start
      };
    } catch (error) {
      this.stats.lastError = error.message;
      return {
        ok: false,
        status: 'failed',
        latencyMs: Date.now() - start,
        error: error.message
      };
    }
  }

  calculateAvgLatency(lastLatency) {
    const successfulRequests = this.stats.totalRequests - this.stats.failedRequests;
    if (successfulRequests <= 1) return lastLatency;

    const previousTotal = this.stats.avgLatencyMs * (successfulRequests - 1);
    return Math.round((previousTotal + lastLatency) / successfulRequests);
  }

  getStats() {
    const total = this.stats.totalRequests;
    const failed = this.stats.failedRequests;
    const successful = Math.max(total - failed, 0);

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: total > 0 ? Number(((successful / total) * 100).toFixed(2)) : 100,
      avgLatencyMs: this.stats.avgLatencyMs,
      lastRequestAt: this.stats.lastRequestAt,
      lastError: this.stats.lastError,
      modelStatus: bertResumeService.getModelStatus()
    };
  }
}

module.exports = new BERTPoolManager();
