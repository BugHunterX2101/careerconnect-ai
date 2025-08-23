import api from './api'

class JobService {
  async getRecommendations() {
    try {
      const response = await api.get('/jobs/recommendations')
      return response.data.recommendations
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
      const response = await api.post(`/jobs/${jobId}/apply`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async saveJob(jobId) {
    try {
      const response = await api.post(`/jobs/${jobId}/save`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async removeSavedJob(jobId) {
    try {
      const response = await api.delete(`/jobs/${jobId}/save`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getSavedJobs() {
    try {
      const response = await api.get('/jobs/saved')
      return response.data.savedJobs
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getAppliedJobs() {
    try {
      const response = await api.get('/jobs/applied')
      return response.data.appliedJobs
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobStats() {
    try {
      const response = await api.get('/jobs/stats')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getSimilarJobs(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/similar`)
      return response.data.similarJobs
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobAlerts() {
    try {
      const response = await api.get('/jobs/alerts')
      return response.data.alerts
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createJobAlert(alertData) {
    try {
      const response = await api.post('/jobs/alerts', alertData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateJobAlert(alertId, alertData) {
    try {
      const response = await api.put(`/jobs/alerts/${alertId}`, alertData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteJobAlert(alertId) {
    try {
      const response = await api.delete(`/jobs/alerts/${alertId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Employer methods
  async postJob(jobData) {
    try {
      const response = await api.post('/jobs', jobData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateJob(jobId, jobData) {
    try {
      const response = await api.put(`/jobs/${jobId}`, jobData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteJob(jobId) {
    try {
      const response = await api.delete(`/jobs/${jobId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getEmployerJobs() {
    try {
      const response = await api.get('/jobs/employer')
      return response.data.jobs
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobApplications(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/applications`)
      return response.data.applications
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const response = await api.put(`/jobs/applications/${applicationId}`, {
        status,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async searchCandidates(params) {
    try {
      const response = await api.get('/jobs/candidates/search', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getCandidateProfile(candidateId) {
    try {
      const response = await api.get(`/jobs/candidates/${candidateId}`)
      return response.data.candidate
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async shortlistCandidate(candidateId, jobId) {
    try {
      const response = await api.post(`/jobs/candidates/${candidateId}/shortlist`, {
        jobId,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async removeFromShortlist(candidateId, jobId) {
    try {
      const response = await api.delete(`/jobs/candidates/${candidateId}/shortlist`, {
        data: { jobId },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getShortlistedCandidates(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/shortlist`)
      return response.data.shortlistedCandidates
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async scheduleInterview(interviewData) {
    try {
      const response = await api.post('/jobs/interviews', interviewData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getInterviews(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/interviews`)
      return response.data.interviews
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateInterview(interviewId, interviewData) {
    try {
      const response = await api.put(`/jobs/interviews/${interviewId}`, interviewData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async cancelInterview(interviewId) {
    try {
      const response = await api.delete(`/jobs/interviews/${interviewId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred'
      return new Error(message)
    } else if (error.request) {
      return new Error('Network error. Please check your connection.')
    } else {
      return new Error('An unexpected error occurred.')
    }
  }
}

export const jobService = new JobService()
