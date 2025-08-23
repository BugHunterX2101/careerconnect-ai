import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { resumeService } from '../services/resumeService'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'
import toast from 'react-hot-toast'

const ResumeContext = createContext()

const initialState = {
  resumes: [],
  currentResume: null,
  loading: false,
  error: null,
  processingStatus: null,
}

const resumeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_RESUMES':
      return { ...state, resumes: action.payload, loading: false }
    case 'SET_CURRENT_RESUME':
      return { ...state, currentResume: action.payload }
    case 'ADD_RESUME':
      return { ...state, resumes: [action.payload, ...state.resumes] }
    case 'UPDATE_RESUME':
      return {
        ...state,
        resumes: state.resumes.map((resume) =>
          resume.id === action.payload.id ? action.payload : resume
        ),
        currentResume:
          state.currentResume?.id === action.payload.id
            ? action.payload
            : state.currentResume,
      }
    case 'DELETE_RESUME':
      return {
        ...state,
        resumes: state.resumes.filter((resume) => resume.id !== action.payload),
        currentResume:
          state.currentResume?.id === action.payload ? null : state.currentResume,
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_PROCESSING_STATUS':
      return { ...state, processingStatus: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const ResumeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(resumeReducer, initialState)
  const { user } = useAuth()
  const { socket, on, off } = useSocket()
  const queryClient = useQueryClient()

  // Fetch user's resumes
  const {
    data: resumes,
    isLoading: resumesLoading,
    error: resumesError,
    refetch: refetchResumes,
  } = useQuery(
    ['resumes', user?.id],
    () => resumeService.getResumes(),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Upload resume mutation
  const uploadResumeMutation = useMutation(
    (file) => resumeService.uploadResume(file),
    {
      onSuccess: (data) => {
        dispatch({ type: 'ADD_RESUME', payload: data.resume })
        toast.success('Resume uploaded successfully! Processing...')
        queryClient.invalidateQueries(['resumes', user?.id])
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to upload resume')
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  // Update resume mutation
  const updateResumeMutation = useMutation(
    ({ id, data }) => resumeService.updateResume(id, data),
    {
      onSuccess: (data) => {
        dispatch({ type: 'UPDATE_RESUME', payload: data.resume })
        toast.success('Resume updated successfully!')
        queryClient.invalidateQueries(['resumes', user?.id])
        queryClient.invalidateQueries(['resume', data.resume.id])
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update resume')
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  // Delete resume mutation
  const deleteResumeMutation = useMutation(
    (id) => resumeService.deleteResume(id),
    {
      onSuccess: (data) => {
        dispatch({ type: 'DELETE_RESUME', payload: data.id })
        toast.success('Resume deleted successfully!')
        queryClient.invalidateQueries(['resumes', user?.id])
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete resume')
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  // Reprocess resume mutation
  const reprocessResumeMutation = useMutation(
    (id) => resumeService.reprocessResume(id),
    {
      onSuccess: (data) => {
        dispatch({ type: 'UPDATE_RESUME', payload: data.resume })
        toast.success('Resume reprocessing started!')
        queryClient.invalidateQueries(['resumes', user?.id])
        queryClient.invalidateQueries(['resume', data.resume.id])
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to reprocess resume')
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  // Get job recommendations mutation
  const getJobRecommendationsMutation = useMutation(
    (id) => resumeService.getJobRecommendations(id),
    {
      onSuccess: (data) => {
        toast.success('Job recommendations generated!')
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to get job recommendations')
        throw error
      },
    }
  )

  // Update state when resumes data changes
  useEffect(() => {
    if (resumes) {
      dispatch({ type: 'SET_RESUMES', payload: resumes })
    }
  }, [resumes])

  // Handle socket events for resume processing
  useEffect(() => {
    if (socket) {
      const handleProcessingUpdate = (data) => {
        dispatch({ type: 'SET_PROCESSING_STATUS', payload: data })
        if (data.resumeId) {
          queryClient.invalidateQueries(['resume', data.resumeId])
        }
      }

      const handleProcessingComplete = (data) => {
        dispatch({ type: 'SET_PROCESSING_STATUS', payload: null })
        if (data.resumeId) {
          queryClient.invalidateQueries(['resume', data.resumeId])
          queryClient.invalidateQueries(['resumes', user?.id])
        }
      }

      const handleProcessingError = (data) => {
        dispatch({ type: 'SET_PROCESSING_STATUS', payload: null })
        dispatch({ type: 'SET_ERROR', payload: data.error })
        if (data.resumeId) {
          queryClient.invalidateQueries(['resume', data.resumeId])
        }
      }

      on('resume:processing', handleProcessingUpdate)
      on('resume:completed', handleProcessingComplete)
      on('resume:error', handleProcessingError)

      return () => {
        off('resume:processing', handleProcessingUpdate)
        off('resume:completed', handleProcessingComplete)
        off('resume:error', handleProcessingError)
      }
    }
  }, [socket, on, off, queryClient, user?.id])

  const uploadResume = async (file) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await uploadResumeMutation.mutateAsync(file)
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateResume = async (id, data) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await updateResumeMutation.mutateAsync({ id, data })
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const deleteResume = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await deleteResumeMutation.mutateAsync(id)
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const reprocessResume = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await reprocessResumeMutation.mutateAsync(id)
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const getJobRecommendations = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await getJobRecommendationsMutation.mutateAsync(id)
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const setCurrentResume = (resume) => {
    dispatch({ type: 'SET_CURRENT_RESUME', payload: resume })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    resumes: state.resumes,
    currentResume: state.currentResume,
    loading: state.loading || resumesLoading,
    error: state.error || resumesError?.message,
    processingStatus: state.processingStatus,
    uploadResume,
    updateResume,
    deleteResume,
    reprocessResume,
    getJobRecommendations,
    setCurrentResume,
    clearError,
    refetchResumes,
  }

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
}

export const useResume = () => {
  const context = useContext(ResumeContext)
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider')
  }
  return context
}
