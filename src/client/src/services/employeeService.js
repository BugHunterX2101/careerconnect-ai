import api from './api';

export const employeeService = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/employee/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Applications
  getApplications: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employee/applications?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  getApplicationById: async (applicationId) => {
    try {
      const response = await api.get(`/employee/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  withdrawApplication: async (applicationId) => {
    try {
      const response = await api.delete(`/employee/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw error;
    }
  },

  // Interviews
  getInterviews: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employee/interviews?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
      throw error;
    }
  },

  updateInterviewStatus: async (interviewId, status) => {
    try {
      const response = await api.patch(`/employee/interviews/${interviewId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating interview status:', error);
      throw error;
    }
  },

  // Job Recommendations
  getJobRecommendations: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/jobs/recommendations?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
      throw error;
    }
  },

  // Job Search
  searchJobs: async (searchParams) => {
    try {
      const params = new URLSearchParams(searchParams);
      const response = await api.get(`/jobs/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  },

  // Job Actions
  applyToJob: async (jobId, applicationData) => {
    try {
      const formData = new FormData();
      Object.keys(applicationData).forEach(key => {
        if (applicationData[key] !== null && applicationData[key] !== undefined) {
          formData.append(key, applicationData[key]);
        }
      });

      const response = await api.post(`/jobs/apply/${jobId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  },

  saveJob: async (jobId) => {
    try {
      const response = await api.post(`/jobs/save/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  },

  unsaveJob: async (jobId) => {
    try {
      const response = await api.delete(`/jobs/save/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error unsaving job:', error);
      throw error;
    }
  },

  getSavedJobs: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/employee/saved-jobs?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      throw error;
    }
  },

  // Resume Management
  uploadResume: async (resumeFile, resumeData = {}) => {
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      Object.keys(resumeData).forEach(key => {
        formData.append(key, resumeData[key]);
      });

      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  getResumes: async () => {
    try {
      const response = await api.get('/resume');
      return response.data;
    } catch (error) {
      console.error('Error fetching resumes:', error);
      throw error;
    }
  },

  deleteResume: async (resumeId) => {
    try {
      const response = await api.delete(`/resume/${resumeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  uploadAvatar: async (avatarFile) => {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Skills Management
  updateSkills: async (skills) => {
    try {
      const response = await api.put('/profile/skills', { skills });
      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  },

  // Career Insights
  getCareerInsights: async () => {
    try {
      const response = await api.get('/employee/career-insights');
      return response.data;
    } catch (error) {
      console.error('Error fetching career insights:', error);
      throw error;
    }
  },

  getSalaryInsights: async (jobTitle, location) => {
    try {
      const params = new URLSearchParams({ jobTitle, location });
      const response = await api.get(`/employee/salary-insights?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salary insights:', error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/employee/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/employee/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Settings
  getSettings: async () => {
    try {
      const response = await api.get('/employee/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await api.put('/employee/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};

export default employeeService;