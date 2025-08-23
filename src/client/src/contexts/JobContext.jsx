import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { jobService } from '../services/jobService'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'
import toast from 'react-hot-toast'

const JobContext = createContext()

const initialState = {
  jobs: [],
  recommendations: [],
  currentJob: null,
  loading: false,
  error: null,
  filters: {
    location: '',
    salary: '',
    experience: '',
    skills: [],
    employmentType: '',
    seniority: '',
  },
  searchQuery: '',
}

const jobReducer = (state, action) => {
  switch (action.type) {
    case 'SET_JOBS':
      return { ...state, jobs: action.payload, loading: false }
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload, loading: false }
    case 'SET_CURRENT_JOB':
      return { ...state, currentJob: action.payload }
    case 'ADD_JOB':
      return { ...state, jobs: [action.payload, ...state.jobs] }
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id ? action.payload : job
        ),
        currentJob:
          state.currentJob?.id === action.payload.id
            ? action.payload
            : state.currentJob,
      }
    case 'DELETE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.payload),
        currentJob:
          state.currentJob?.id === action.payload ? null : state.currentJob,
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        searchQuery: '',
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState)
  const { user } = useAuth()
  const { socket, on, off } = useSocket()
  const queryClient = useQueryClient()

  // Fetch job recommendations
  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useQuery(
    ['job-recommendations', user?.id],
    () => jobService.getRecommendations(),
    {
      enabled: !!user?.id,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  )

  // Search jobs mutation
  const searchJobsMutation = useMutation(
    (params) => jobService.searchJobs(params),
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_JOBS', payload: data.jobs })
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to search jobs')
        dispatch({ type: 'SET_ERROR', payload: error.message })
        throw error
      },
    }
  )

  // Apply for job mutation
  const applyForJobMutation = useMutation(
    (jobId) => jobService.applyForJob(jobId),
    {
      onSuccess: (data) => {
        toast.success('Application submitted successfully!')
        queryClient.invalidateQueries(['job-recommendations', user?.id])
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to apply for job')
        throw error
      },
    }
  )

  // Save job mutation
  const saveJobMutation = useMutation(
    (jobId) => jobService.saveJob(jobId),
    {
      onSuccess: (data) => {
        toast.success('Job saved successfully!')
        queryClient.invalidateQueries(['job-recommendations', user?.id])
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to save job')
        throw error
      },
    }
  )

  // Remove saved job mutation
  const removeSavedJobMutation = useMutation(
    (jobId) => jobService.removeSavedJob(jobId),
    {
      onSuccess: (data) => {
        toast.success('Job removed from saved list!')
        queryClient.invalidateQueries(['job-recommendations', user?.id])
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to remove saved job')
        throw error
      },
    }
  )

  // Get job details mutation
  const getJobDetailsMutation = useMutation(
    (jobId) => jobService.getJobDetails(jobId),
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_CURRENT_JOB', payload: data.job })
        return data
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to get job details')
        throw error
      },
    }
  )

  // Update state when recommendations data changes
  useEffect(() => {
    if (recommendations) {
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations })
    }
  }, [recommendations])

  // Handle socket events for job updates
  useEffect(() => {
    if (socket) {
      const handleNewRecommendations = (data) => {
        console.log('New job recommendations:', data)
        queryClient.invalidateQueries(['job-recommendations', user?.id])
      }

      const handleJobUpdate = (data) => {
        console.log('Job updated:', data)
        queryClient.invalidateQueries(['job-recommendations', user?.id])
        if (state.currentJob?.id === data.jobId) {
          queryClient.invalidateQueries(['job', data.jobId])
        }
      }

      on('jobs:recommendations', handleNewRecommendations)
      on('job:updated', handleJobUpdate)

      return () => {
        off('jobs:recommendations', handleNewRecommendations)
        off('job:updated', handleJobUpdate)
      }
    }
  }, [socket, on, off, queryClient, user?.id, state.currentJob])

  const searchJobs = async (params) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const result = await searchJobsMutation.mutateAsync(params)
      return result
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const applyForJob = async (jobId) => {
    try {
      const result = await applyForJobMutation.mutateAsync(jobId)
      return result
    } catch (error) {
      throw error
    }
  }

  const saveJob = async (jobId) => {
    try {
      const result = await saveJobMutation.mutateAsync(jobId)
      return result
    } catch (error) {
      throw error
    }
  }

  const removeSavedJob = async (jobId) => {
    try {
      const result = await removeSavedJobMutation.mutateAsync(jobId)
      return result
    } catch (error) {
      throw error
    }
  }

  const getJobDetails = async (jobId) => {
    try {
      const result = await getJobDetailsMutation.mutateAsync(jobId)
      return result
    } catch (error) {
      throw error
    }
  }

  const setCurrentJob = (job) => {
    dispatch({ type: 'SET_CURRENT_JOB', payload: job })
  }

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const setSearchQuery = (query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    jobs: state.jobs,
    recommendations: state.recommendations,
    currentJob: state.currentJob,
    loading: state.loading || recommendationsLoading,
    error: state.error || recommendationsError?.message,
    filters: state.filters,
    searchQuery: state.searchQuery,
    searchJobs,
    applyForJob,
    saveJob,
    removeSavedJob,
    getJobDetails,
    setCurrentJob,
    setFilters,
    setSearchQuery,
    clearFilters,
    clearError,
    refetchRecommendations,
  }

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>
}

export const useJob = () => {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error('useJob must be used within a JobProvider')
  }
  return context
}
