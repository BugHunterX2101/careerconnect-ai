const { ApifyClient } = require('apify-client');
const logger = require('../middleware/logger');

// Apify actor for LinkedIn job scraping
// https://apify.com/bebity/linkedin-jobs-scraper
const LINKEDIN_ACTOR_ID = 'bebity/linkedin-jobs-scraper';

// Cache to avoid hitting Apify on every request
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let client = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) throw new Error('APIFY_API_KEY is not set');
    client = new ApifyClient({ token: apiKey });
  }
  return client;
};

/**
 * Build a deterministic cache key from search params.
 */
function buildCacheKey(params) {
  return JSON.stringify({
    q: (params.query || '').toLowerCase().trim(),
    loc: (params.location || '').toLowerCase().trim(),
    limit: params.limit || 25,
    exp: params.experienceLevel || '',
    type: params.jobType || ''
  });
}

/**
 * Map a raw Apify/LinkedIn job item to our internal schema.
 */
function normalizeJob(item) {
  return {
    id: String(item.id || item.jobId || `apify-${Date.now()}-${Math.random()}`),
    title: item.title || item.jobTitle || '',
    company: item.companyName || item.company || 'Unknown Company',
    location: item.location || item.jobLocation || 'Remote',
    description: item.descriptionHtml
      ? item.descriptionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : (item.description || ''),
    applyUrl: item.applyUrl || item.jobUrl || `https://www.linkedin.com/jobs/view/${item.id || ''}`,
    postedAt: item.postedAt || item.postedDate || null,
    salary: item.salary || item.salaryRange || null,
    employmentType: item.employmentType || item.jobType || 'Full-time',
    experienceLevel: item.seniorityLevel || item.experienceLevel || null,
    skills: Array.isArray(item.skills) ? item.skills : [],
    industry: item.industries ? (Array.isArray(item.industries) ? item.industries.join(', ') : item.industries) : '',
    companyLogoUrl: item.companyLogo || item.companyLogoUrl || null,
    applicantCount: item.applicants || item.applicantCount || null,
    remote: Boolean(
      (item.location || '').toLowerCase().includes('remote') ||
      (item.title || '').toLowerCase().includes('remote') ||
      item.isRemote
    ),
    source: 'LinkedIn',
    platform: 'linkedin',
    isRealTime: true,
    scrapedAt: new Date().toISOString()
  };
}

/**
 * Search LinkedIn jobs using Apify scraper.
 * @param {Object} params
 * @param {string} params.query - Search keywords (e.g. "react developer")
 * @param {string} [params.location] - Location (e.g. "San Francisco, CA")
 * @param {number} [params.limit=25] - Max results
 * @param {string} [params.experienceLevel] - "internship"|"entry_level"|"associate"|"mid_senior_level"|"director"|"executive"
 * @param {string} [params.jobType] - "full_time"|"part_time"|"contract"|"temporary"|"internship"
 * @param {string} [params.datePosted] - "past_24_hours"|"past_week"|"past_month"|"any_time"
 * @returns {Promise<Array>} Normalized job listings
 */
async function searchLinkedInJobsViaApify(params = {}) {
  const {
    query = '',
    location = '',
    limit = 25,
    experienceLevel = '',
    jobType = '',
    datePosted = 'past_month'
  } = params;

  const cacheKey = buildCacheKey(params);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    logger.info(`Apify cache hit for: ${query} @ ${location}`);
    return cached.data;
  }

  const apifyClient = getClient();

  // Actor input format for bebity/linkedin-jobs-scraper
  const input = {
    rows: Math.min(limit, 100),
    search: query || 'software engineer',
    location: location || 'United States',
    datePosted,
    ...(experienceLevel && { experienceLevel }),
    ...(jobType && { jobType }),
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL']
    }
  };

  logger.info(`Apify LinkedIn scrape: "${input.search}" @ "${input.location}" (${input.rows} results)`);

  try {
    const run = await apifyClient.actor(LINKEDIN_ACTOR_ID).call(input, {
      waitSecs: 120
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    const normalized = (items || []).map(normalizeJob).filter(j => j.title);
    logger.info(`Apify returned ${normalized.length} LinkedIn jobs`);

    cache.set(cacheKey, { data: normalized, ts: Date.now() });
    return normalized;
  } catch (error) {
    logger.error('Apify LinkedIn scrape error:', error.message);
    throw error;
  }
}

/**
 * Get personalized job recommendations from LinkedIn via Apify.
 * Builds a smart keyword query from the user's skills + experience.
 */
async function getLinkedInRecommendations(userProfile, limit = 20) {
  const skills = Array.isArray(userProfile.skills)
    ? userProfile.skills.map(s => (typeof s === 'object' ? s.name : s)).filter(Boolean)
    : [];
  const location = typeof userProfile.location === 'object'
    ? [userProfile.location.city, userProfile.location.state, userProfile.location.country].filter(Boolean).join(', ')
    : (userProfile.location || '');

  // Build a smart search query from skills + experience
  const topSkills = skills.slice(0, 3).join(' ');
  const experienceTitle = userProfile.currentRole || userProfile.title || '';
  const query = [topSkills, experienceTitle].filter(Boolean).join(' ') || 'software engineer';

  const expLevelMap = {
    entry: 'entry_level',
    mid: 'mid_senior_level',
    senior: 'mid_senior_level',
    director: 'director',
    executive: 'executive'
  };
  const experienceLevel = expLevelMap[userProfile.experienceLevel] || '';

  const jobs = await searchLinkedInJobsViaApify({
    query,
    location,
    limit,
    experienceLevel,
    datePosted: 'past_month'
  });

  // Score jobs by skills overlap
  const userSkillsLower = new Set(skills.map(s => s.toLowerCase()));
  return jobs
    .map(job => {
      const jobText = `${job.title} ${job.description}`.toLowerCase();
      const matchingSkills = [...userSkillsLower].filter(s => jobText.includes(s));
      const matchScore = userSkillsLower.size > 0
        ? Math.round((matchingSkills.length / userSkillsLower.size) * 100)
        : 50;
      return { ...job, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get trending jobs for a location via Apify.
 */
async function getTrendingJobs(location = 'United States', limit = 20) {
  return searchLinkedInJobsViaApify({
    query: 'software engineer developer',
    location,
    limit,
    datePosted: 'past_week'
  });
}

/**
 * Clear the in-memory cache (useful for testing).
 */
function clearCache() {
  cache.clear();
}

module.exports = {
  searchLinkedInJobsViaApify,
  getLinkedInRecommendations,
  getTrendingJobs,
  normalizeJob,
  clearCache
};
