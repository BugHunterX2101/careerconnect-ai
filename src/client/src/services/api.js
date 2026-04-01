import axios from 'axios'
import { API_BASE_URL } from '../config/appConfig'
import { emitUserError, reportApiError } from '../utils/observability'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          )

          const { token } = response.data
          localStorage.setItem('token', token)

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        reportApiError(refreshError, { stage: 'refresh_token' })
        emitUserError('Your session has expired. Please login again.', 'auth')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data)
      emitUserError('You do not have permission to perform this action.', 'api')
    }

    // Handle 404 errors (not found)
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data)
    }

    // Handle 500 errors (server error)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data)
      emitUserError('Server is currently unavailable. Please try again shortly.', 'api')
    }

    reportApiError(error, { stage: 'response_interceptor' })

    return Promise.reject(error)
  }
)

// Add request/response logging in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      const sanitizedData = {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: JSON.stringify(config.data).replace(/[<>]/g, ''),
        headers: Object.fromEntries(
          Object.entries(config.headers).map(([k, v]) => [k, String(v).replace(/[<>]/g, '')])
        ),
      }
      console.log('API Request:', sanitizedData)
      return config
    },
    (error) => {
      console.error('API Request Error:', error.message)
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    (response) => {
      console.log('API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      })
      return response
    },
    (error) => {
      console.error('API Response Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      return Promise.reject(error)
    }
  )
}

export default api
