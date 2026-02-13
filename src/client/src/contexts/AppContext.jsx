import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import employeeService from '../services/employeeService';
import employerService from '../services/employerService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_JOBS: 'SET_JOBS',
  SET_APPLICATIONS: 'SET_APPLICATIONS',
  SET_INTERVIEWS: 'SET_INTERVIEWS',
  UPDATE_APPLICATION_STATUS: 'UPDATE_APPLICATION_STATUS',
  UPDATE_INTERVIEW_STATUS: 'UPDATE_INTERVIEW_STATUS',
  SET_ANALYTICS: 'SET_ANALYTICS'
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  notifications: [],
  dashboardData: null,
  jobs: [],
  applications: [],
  interviews: [],
  analytics: null
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    
    case actionTypes.ADD_NOTIFICATION:
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications] 
      };
    
    case actionTypes.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
    
    case actionTypes.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload };
    
    case actionTypes.SET_JOBS:
      return { ...state, jobs: action.payload };
    
    case actionTypes.SET_APPLICATIONS:
      return { ...state, applications: action.payload };
    
    case actionTypes.SET_INTERVIEWS:
      return { ...state, interviews: action.payload };
    
    case actionTypes.UPDATE_APPLICATION_STATUS:
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === action.payload.id
            ? { ...app, status: action.payload.status }
            : app
        )
      };
    
    case actionTypes.UPDATE_INTERVIEW_STATUS:
      return {
        ...state,
        interviews: state.interviews.map(interview =>
          interview.id === action.payload.id
            ? { ...interview, status: action.payload.status }
            : interview
        )
      };
    
    case actionTypes.SET_ANALYTICS:
      return { ...state, analytics: action.payload };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Helper functions
  const setLoading = (loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Notification functions
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const service = user?.role === 'employer' ? employerService : employeeService;
      const notifications = await service.getNotifications();
      dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: notifications });
    } catch (error) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const service = user?.role === 'employer' ? employerService : employeeService;
      await service.markNotificationAsRead(notificationId);
      dispatch({ type: actionTypes.MARK_NOTIFICATION_READ, payload: notificationId });
    } catch (error) {
      setError('Failed to mark notification as read');
    }
  };

  // Dashboard functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const service = user?.role === 'employer' ? employerService : employeeService;
      const dashboardData = await service.getDashboardStats();
      dispatch({ type: actionTypes.SET_DASHBOARD_DATA, payload: dashboardData });
    } catch (error) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Job functions (for employers)
  const fetchJobs = async (filters = {}) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      const jobs = await employerService.getJobs(filters);
      dispatch({ type: actionTypes.SET_JOBS, payload: jobs });
    } catch (error) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      const newJob = await employerService.createJob(jobData);
      dispatch({ type: actionTypes.SET_JOBS, payload: [...state.jobs, newJob] });
      return newJob;
    } catch (error) {
      setError('Failed to create job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobId, jobData) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      const updatedJob = await employerService.updateJob(jobId, jobData);
      dispatch({
        type: actionTypes.SET_JOBS,
        payload: state.jobs.map(job => job.id === jobId ? updatedJob : job)
      });
      return updatedJob;
    } catch (error) {
      setError('Failed to update job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      await employerService.deleteJob(jobId);
      dispatch({
        type: actionTypes.SET_JOBS,
        payload: state.jobs.filter(job => job.id !== jobId)
      });
    } catch (error) {
      setError('Failed to delete job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Application functions (for employees)
  const fetchApplications = async (filters = {}) => {
    if (user?.role !== 'jobseeker') return;
    
    try {
      setLoading(true);
      const applications = await employeeService.getApplications(filters);
      dispatch({ type: actionTypes.SET_APPLICATIONS, payload: applications });
    } catch (error) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const applyToJob = async (jobId, applicationData) => {
    if (user?.role !== 'jobseeker') return;
    
    try {
      setLoading(true);
      const application = await employeeService.applyToJob(jobId, applicationData);
      dispatch({
        type: actionTypes.SET_APPLICATIONS,
        payload: [...state.applications, application]
      });
      return application;
    } catch (error) {
      setError('Failed to apply to job');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId) => {
    if (user?.role !== 'jobseeker') return;
    
    try {
      setLoading(true);
      await employeeService.withdrawApplication(applicationId);
      dispatch({
        type: actionTypes.SET_APPLICATIONS,
        payload: state.applications.filter(app => app.id !== applicationId)
      });
    } catch (error) {
      setError('Failed to withdraw application');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Interview functions
  const fetchInterviews = async (filters = {}) => {
    try {
      setLoading(true);
      const service = user?.role === 'employer' ? employerService : employeeService;
      const interviews = await service.getInterviews(filters);
      dispatch({ type: actionTypes.SET_INTERVIEWS, payload: interviews });
    } catch (error) {
      setError('Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async (interviewData) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      const interview = await employerService.scheduleInterview(interviewData);
      dispatch({
        type: actionTypes.SET_INTERVIEWS,
        payload: [...state.interviews, interview]
      });
      return interview;
    } catch (error) {
      setError('Failed to schedule interview');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Analytics functions (for employers)
  const fetchAnalytics = async (dateRange = {}) => {
    if (user?.role !== 'employer') return;
    
    try {
      setLoading(true);
      const analytics = await employerService.getAnalytics(dateRange);
      dispatch({ type: actionTypes.SET_ANALYTICS, payload: analytics });
    } catch (error) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchDashboardData();
      
      if (user.role === 'employer') {
        fetchJobs();
        fetchAnalytics();
      } else if (user.role === 'jobseeker') {
        fetchApplications();
      }
      
      fetchInterviews();
    }
  }, [user]);

  const value = {
    // State
    ...state,
    
    // General functions
    setLoading,
    setError,
    clearError,
    
    // Notification functions
    fetchNotifications,
    markNotificationAsRead,
    
    // Dashboard functions
    fetchDashboardData,
    
    // Job functions (employer)
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    
    // Application functions (employee)
    fetchApplications,
    applyToJob,
    withdrawApplication,
    
    // Interview functions
    fetchInterviews,
    scheduleInterview,
    
    // Analytics functions (employer)
    fetchAnalytics
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;