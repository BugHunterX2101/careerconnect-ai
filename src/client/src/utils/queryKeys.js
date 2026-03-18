export const queryKeys = {
  dashboard: {
    all: ['dashboard'],
    employee: ['dashboard', 'employee'],
    employer: ['dashboard', 'employer'],
    analytics: ['dashboard', 'analytics']
  },
  jobs: {
    all: ['jobs'],
    recommendations: ['jobs', 'recommendations'],
    search: (filters = {}) => ['jobs', 'search', filters],
    detail: (jobId) => ['jobs', 'detail', jobId]
  },
  profile: {
    all: ['profile'],
    me: ['profile', 'me']
  },
  notifications: {
    all: ['notifications']
  },
  interviews: {
    all: ['interviews']
  }
};

export default queryKeys;
