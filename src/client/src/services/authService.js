import api from './api'

class AuthService {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async verifyToken() {
    try {
      const response = await api.get('/auth/verify')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async logout() {
    try {
      const response = await api.post('/auth/logout')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // OAuth methods
  async googleAuth(code) {
    try {
      const response = await api.post('/auth/google', { code })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async linkedinAuth(code) {
    try {
      const response = await api.post('/auth/linkedin', { code })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async githubAuth(code) {
    try {
      const response = await api.post('/auth/github', { code })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred'
      return new Error(message)
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.')
    } else {
      // Something else happened
      return new Error('An unexpected error occurred.')
    }
  }
}

export const authService = new AuthService()
