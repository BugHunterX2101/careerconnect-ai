import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/shared/LoadingSpinner'

// Layout Components
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import PublicRoute from './components/Auth/PublicRoute'

// Public Pages
import LandingPage from './pages/LandingPage'
import FeaturesPage from './pages/FeaturesPage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'

// Protected Pages
import DashboardPage from './pages/Dashboard/DashboardPage'
import ResumeUploadPage from './pages/Resume/ResumeUploadPage'
import ResumeAnalysisPage from './pages/Resume/ResumeAnalysisPage'
import ResumeEditPage from './pages/Resume/ResumeEditPage'
import JobRecommendationsPage from './pages/Jobs/JobRecommendationsPage'
import JobSearchPage from './pages/Jobs/JobSearchPage'
import JobDetailsPage from './pages/Jobs/JobDetailsPage'
import ProfilePage from './pages/Profile/ProfilePage'
import SettingsPage from './pages/Settings/SettingsPage'

// Employee Pages
import EmployeeDashboardPage from './pages/Employee/EmployeeDashboardPage'
import ApplicationsPage from './pages/Employee/ApplicationsPage'
import InterviewsPage from './pages/Employee/InterviewsPage'

// Employer Pages
import EmployerDashboardPage from './pages/Employer/EmployerDashboardPage'
import JobPostingPage from './pages/Employer/JobPostingPage'
import JobManagementPage from './pages/Employer/JobManagementPage'
import ApplicantsPage from './pages/Employer/ApplicantsPage'
import AnalyticsPage from './pages/Employer/AnalyticsPage'
import CandidateSearchPage from './pages/Employer/CandidateSearchPage'
import CandidateDetailsPage from './pages/Employer/CandidateDetailsPage'
import InterviewSchedulerPage from './pages/Employer/InterviewSchedulerPage'

// Chat and Video Pages
import ChatPage from './pages/Chat/ChatPage'
import VideoCallPage from './pages/Video/VideoCallPage'

// Error Pages
import NotFoundPage from './pages/Error/NotFoundPage'
import ErrorPage from './pages/Error/ErrorPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <LoadingSpinner 
        message="Initializing CareerConnect AI..."
        fullScreen
      />
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === 'employer' ? <EmployerDashboardPage /> : <EmployeeDashboardPage />}
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Resume Routes */}
      <Route
        path="/resume/upload"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeUploadPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/resume/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeAnalysisPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/resume/:id/analysis"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeAnalysisPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/resume/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/resume/analysis"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumeAnalysisPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Job Routes */}
      <Route
        path="/jobs/recommendations"
        element={
          <ProtectedRoute>
            <Layout>
              <JobRecommendationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/jobs/search"
        element={
          <ProtectedRoute>
            <Layout>
              <JobSearchPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/jobs/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <JobDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Profile Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <EmployeeDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employee/applications"
        element={
          <ProtectedRoute>
            <Layout>
              <ApplicationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employee/interviews"
        element={
          <ProtectedRoute>
            <Layout>
              <InterviewsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <EmployerDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/jobs"
        element={
          <ProtectedRoute>
            <Layout>
              <JobManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/jobs/post"
        element={
          <ProtectedRoute>
            <Layout>
              <JobPostingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/jobs/:jobId"
        element={
          <ProtectedRoute>
            <Layout>
              <JobManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/jobs/:jobId/applicants"
        element={
          <ProtectedRoute>
            <Layout>
              <ApplicantsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/candidates/search"
        element={
          <ProtectedRoute>
            <Layout>
              <CandidateSearchPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/applications"
        element={
          <ProtectedRoute>
            <Layout>
              <ApplicantsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/interviews"
        element={
          <ProtectedRoute>
            <Layout>
              <InterviewSchedulerPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/candidates/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CandidateDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employer/interviews/schedule"
        element={
          <ProtectedRoute>
            <Layout>
              <InterviewSchedulerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Communication Routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/video/:roomId"
        element={
          <ProtectedRoute>
            <VideoCallPage />
          </ProtectedRoute>
        }
      />

      {/* Error Routes */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
