import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const navigate = useNavigate()

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' })
          const response = await authService.verifyToken()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.user, token },
          })
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error.message,
          })
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authService.login(credentials)
      localStorage.setItem('token', response.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      })
      toast.success('Login successful!')
      navigate('/dashboard')
      return response
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message,
      })
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authService.register(userData)
      localStorage.setItem('token', response.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      })
      toast.success('Registration successful!')
      navigate('/dashboard')
      return response
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message,
      })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.user,
      })
      toast.success('Profile updated successfully')
      return response
    } catch (error) {
      toast.error(error.message || 'Profile update failed')
      throw error
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData)
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(error.message || 'Password change failed')
      throw error
    }
  }

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email)
      toast.success('Password reset email sent')
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email')
      throw error
    }
  }

  const resetPassword = async (token, password) => {
    try {
      await authService.resetPassword(token, password)
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Password reset failed')
      throw error
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.token && !!state.user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
