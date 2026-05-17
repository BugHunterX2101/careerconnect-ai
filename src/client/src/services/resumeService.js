import api from './api'

class ResumeService {
  async getResumes() {
    try {
      const response = await api.get('/resume')
      return response.data.resumes || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResume(id) {
    try {
      const response = await api.get(`/resume/${id}`)
      return response.data.resume || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async uploadResume(file) {
    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateResume(id, data) {
    try {
      const response = await api.put(`/resume/${id}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteResume(id) {
    try {
      const response = await api.delete(`/resume/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResumeStatus(id) {
    try {
      const response = await api.get(`/resume/${id}/status`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async reprocessResume(id) {
    try {
      const response = await api.post(`/resume/${id}/reprocess`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResumeAnalysis(id) {
    try {
      const response = await api.get(`/resume/${id}/analysis`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobRecommendations(id) {
    try {
      const response = await api.get(`/resume/${id}/recommendations`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getPublicResume(id) {
    try {
      const response = await api.get(`/resume/public/${id}`)
      return response.data.resume || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async searchResumes(query) {
    try {
      const response = await api.get('/resume', { params: query })
      return response.data.resumes || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResumeStats() {
    try {
      const response = await api.get('/resume')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async exportResume(id, format = 'pdf') {
    try {
      const response = await api.get(`/resume/${id}/export`, {
        params: { format },
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async shareResume(id, email) {
    try {
      const response = await api.post(`/resume/${id}/share`, { email })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResumeHistory(id) {
    try {
      const response = await api.get(`/resume/${id}/history`)
      return response.data.history || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async compareResumes(resumeIds) {
    try {
      const response = await api.post('/resume/compare', { resumeIds })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getResumeTemplates() {
    try {
      const response = await api.get('/resume/templates')
      return response.data.templates || response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async applyTemplate(id, templateId) {
    try {
      const response = await api.post(`/resume/${id}/apply-template`, {
        templateId,
      })
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

export const resumeService = new ResumeService()
