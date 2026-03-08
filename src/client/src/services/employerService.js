import api from './api';

export const employerService = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/employer/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getAnalytics: async (dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/analytics?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Job Management
  getJobs: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employer/jobs?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  getJobById: async (jobId) => {
    try {
      const response = await api.get(`/employer/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  },

  createJob: async (jobData) => {
    try {
      const response = await api.post('/employer/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  updateJob: async (jobId, jobData) => {
    try {
      const response = await api.put(`/employer/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  deleteJob: async (jobId) => {
    try {
      const response = await api.delete(`/employer/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  toggleJobStatus: async (jobId, status) => {
    try {
      const response = await api.patch(`/employer/jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error toggling job status:', error);
      throw error;
    }
  },

  // Applicant Management
  getJobApplicants: async (jobId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employer/jobs/${jobId}/applicants?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job applicants:', error);
      throw error;
    }
  },

  getApplicantById: async (jobId, applicantId) => {
    try {
      const response = await api.get(`/employer/jobs/${jobId}/applicants/${applicantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching applicant:', error);
      throw error;
    }
  },

  updateApplicantStatus: async (jobId, applicantId, status, notes = '') => {
    try {
      const response = await api.patch(`/employer/jobs/${jobId}/applicants/${applicantId}`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating applicant status:', error);
      throw error;
    }
  },

  bulkUpdateApplicants: async (jobId, applicantIds, status) => {
    try {
      const response = await api.patch(`/employer/jobs/${jobId}/applicants/bulk`, {
        applicantIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating applicants:', error);
      throw error;
    }
  },

  downloadApplicantResume: async (jobId, applicantId) => {
    try {
      const response = await api.get(`/employer/jobs/${jobId}/applicants/${applicantId}/resume`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading resume:', error);
      throw error;
    }
  },

  // Interview Management
  getInterviews: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employer/interviews?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
      throw error;
    }
  },

  scheduleInterview: async (interviewData) => {
    try {
      const response = await api.post('/employer/interviews', interviewData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  },

  updateInterview: async (interviewId, interviewData) => {
    try {
      const response = await api.put(`/employer/interviews/${interviewId}`, interviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  },

  cancelInterview: async (interviewId, reason = '') => {
    try {
      const response = await api.patch(`/employer/interviews/${interviewId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error canceling interview:', error);
      throw error;
    }
  },

  // Candidate Search
  searchCandidates: async (searchParams) => {
    try {
      const params = new URLSearchParams(searchParams);
      const response = await api.get(`/employer/candidates/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching candidates:', error);
      throw error;
    }
  },

  getCandidateById: async (candidateId) => {
    try {
      const response = await api.get(`/employer/candidates/${candidateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      throw error;
    }
  },

  inviteCandidate: async (candidateId, jobId, message = '') => {
    try {
      const response = await api.post(`/employer/candidates/${candidateId}/invite`, {
        jobId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error inviting candidate:', error);
      throw error;
    }
  },

  // Company Profile
  getCompanyProfile: async () => {
    try {
      const response = await api.get('/employer/company/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  },

  updateCompanyProfile: async (profileData) => {
    try {
      const response = await api.put('/employer/company/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating company profile:', error);
      throw error;
    }
  },

  uploadCompanyLogo: async (logoFile) => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const response = await api.post('/employer/company/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading company logo:', error);
      throw error;
    }
  },

  // Team Management
  getTeamMembers: async () => {
    try {
      const response = await api.get('/employer/team');
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  inviteTeamMember: async (memberData) => {
    try {
      const response = await api.post('/employer/team/invite', memberData);
      return response.data;
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  },

  updateTeamMemberRole: async (memberId, role) => {
    try {
      const response = await api.patch(`/employer/team/${memberId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  },

  removeTeamMember: async (memberId) => {
    try {
      const response = await api.delete(`/employer/team/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  // Reports and Analytics
  getHiringReport: async (dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/reports/hiring?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching hiring report:', error);
      throw error;
    }
  },

  getJobPerformanceReport: async (jobId, dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/reports/job-performance/${jobId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job performance report:', error);
      throw error;
    }
  },

  exportReport: async (reportType, format = 'csv', filters = {}) => {
    try {
      const params = new URLSearchParams({ ...filters, format });
      const response = await api.get(`/employer/reports/${reportType}/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/employer/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/employer/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Settings
  getSettings: async () => {
    try {
      const response = await api.get('/employer/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await api.put('/employer/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Enhanced Analytics
  getAnalytics: async (dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/analytics?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Pipeline Management
  getPipeline: async () => {
    try {
      const response = await api.get('/employer/pipeline');
      return response.data;
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      throw error;
    }
  },

  // Enhanced Team Management
  getTeamMembers: async () => {
    try {
      const response = await api.get('/employer/team');
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  inviteTeamMember: async (memberData) => {
    try {
      const response = await api.post('/employer/team/invite', memberData);
      return response.data;
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  },

  updateTeamMemberRole: async (memberId, role) => {
    try {
      const response = await api.patch(`/employer/team/${memberId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  },

  removeTeamMember: async (memberId) => {
    try {
      const response = await api.delete(`/employer/team/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  // Enhanced Reports and Analytics
  getHiringReport: async (dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/reports/hiring?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching hiring report:', error);
      throw error;
    }
  },

  getJobPerformanceReport: async (jobId, dateRange = {}) => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await api.get(`/employer/reports/job-performance/${jobId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job performance report:', error);
      throw error;
    }
  },

  exportReport: async (reportType, format = 'csv', filters = {}) => {
    try {
      const params = new URLSearchParams({ ...filters, format });
      const response = await api.get(`/employer/reports/${reportType}/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  // Enhanced Notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/employer/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/employer/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Candidate Rating
  rateCandidateForJob: async (candidateId, jobId) => {
    try {
      const response = await api.post(`/employer/candidates/${candidateId}/rating`, { jobId });
      return response.data;
    } catch (error) {
      console.error('Error rating candidate:', error);
      throw error;
    }
  },

  // Matching Candidates
  getMatchingCandidates: async (jobId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employer/jobs/${jobId}/matching-candidates?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching matching candidates:', error);
      throw error;
    }
  }
};

export default employerService;