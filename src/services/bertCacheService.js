const crypto = require('crypto');

class BERTCacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTtlMs = Number(process.env.BERT_CACHE_TTL_MS || 30 * 60 * 1000);
    this.maxEntries = Number(process.env.BERT_CACHE_MAX_ENTRIES || 500);
  }

  hashInput(input) {
    return crypto.createHash('sha256').update(String(input)).digest('hex');
  }

  evictExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  evictOverflow() {
    if (this.cache.size <= this.maxEntries) return;

    const entries = [...this.cache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toDelete = this.cache.size - this.maxEntries;
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  async get(input) {
    this.evictExpired();
    const key = this.hashInput(input);
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  async set(input, value, ttlMs = this.defaultTtlMs) {
    this.evictExpired();
    const key = this.hashInput(input);
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
    this.evictOverflow();
    return true;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    this.evictExpired();
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      ttlMs: this.defaultTtlMs
    };
  }
}

module.exports = new BERTCacheService();
