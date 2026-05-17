import api from './api'

class JobService {
  async getRecommendations() {
    try {
      const response = await api.get('/jobs/recommendations')
      return response.data.recommendations || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async searchJobs(params) {
    try {
      const response = await api.get('/jobs/search', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobDetails(id) {
    try {
      const response = await api.get(`/jobs/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async applyForJob(jobId) {
    try {
      const response = await api.post(`/jobs/apply/${jobId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async saveJob(jobId) {
    try {
      const response = await api.post(`/jobs/save/${jobId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async removeSavedJob(jobId) {
    try {
      const response = await api.delete(`/jobs/save/${jobId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getSavedJobs() {
    try {
      const response = await api.get('/employee/saved-jobs')
      return response.data.savedJobs || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getAppliedJobs() {
    try {
      const response = await api.get('/employee/applications')
      return response.data.applications || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobStats() {
    try {
      const response = await api.get('/employee/dashboard/stats')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getSimilarJobs(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      return response.data.similarJobs || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobAlerts() {
    try {
      const response = await api.get('/employee/job-alerts')
      return response.data.alerts || response.data.active || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createJobAlert(alertData) {
    try {
      const response = await api.post('/employee/job-alerts', alertData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateJobAlert(alertId, alertData) {
    try {
      const response = await api.put(`/employee/job-alerts/${alertId}`, alertData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteJobAlert(alertId) {
    try {
      const response = await api.delete(`/employee/job-alerts/${alertId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Employer methods
  async postJob(jobData) {
    try {
      const response = await api.post('/employer/jobs', jobData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateJob(jobId, jobData) {
    try {
      const response = await api.put(`/employer/jobs/${jobId}`, jobData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteJob(jobId) {
    try {
      const response = await api.delete(`/employer/jobs/${jobId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getEmployerJobs() {
    try {
      const response = await api.get('/employer/jobs')
      return response.data.jobs || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobApplications(jobId) {
    try {
      const response = await api.get(`/employer/jobs/${jobId}/applicants`)
      return response.data.applicants || response.data.applications || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateApplicationStatus(jobId, applicationId, status) {
    try {
      const response = await api.patch(`/employer/jobs/${jobId}/applicants/${applicationId}`, { status })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async searchCandidates(params) {
    try {
      const response = await api.get('/employer/candidates/search', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getCandidateProfile(candidateId) {
    try {
      const response = await api.get(`/employer/candidates/${candidateId}`)
      return response.data.candidate || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async shortlistCandidate(candidateId, jobId) {
    try {
      const response = await api.post(`/employer/candidates/${candidateId}/rating`, { jobId, action: 'shortlist' })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async removeFromShortlist(candidateId, jobId) {
    try {
      const response = await api.post(`/employer/candidates/${candidateId}/rating`, { jobId, action: 'remove' })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getShortlistedCandidates(jobId) {
    try {
      const response = await api.get(`/employer/jobs/${jobId}/applicants`, { params: { status: 'shortlisted' } })
      return response.data.applicants || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async scheduleInterview(interviewData) {
    try {
      const response = await api.post('/employer/interviews', interviewData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getInterviews(jobId) {
    try {
      const params = jobId ? { jobId } : {}
      const response = await api.get('/employer/interviews', { params })
      return response.data.interviews || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateInterview(interviewId, interviewData) {
    try {
      const response = await api.put(`/employer/interviews/${interviewId}`, interviewData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async cancelInterview(interviewId) {
    try {
      const response = await api.patch(`/employer/interviews/${interviewId}/cancel`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred'
      return new Error(message)
    } else if (error.request) {
      return new Error('Network error. Please check your connection.')
    } else {
      return new Error('An unexpected error occurred.')
    }
  }
}

export const jobService = new JobService()
