import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Card, CardContent, Skeleton } from '@mui/material'
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

// Lazily loaded protected pages
const ResumeUploadPage = lazy(() => import('./pages/Resume/ResumeUploadPage'))
const ResumeAnalysisPage = lazy(() => import('./pages/Resume/ResumeAnalysisPage'))
const ResumeEditPage = lazy(() => import('./pages/Resume/ResumeEditPage'))
const JobRecommendationsPage = lazy(() => import('./pages/Jobs/JobRecommendationsPage'))
const JobSearchPage = lazy(() => import('./pages/Jobs/JobSearchPage'))
const JobDetailsPage = lazy(() => import('./pages/Jobs/JobDetailsPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'))

// Employee and employer pages
const EmployeeDashboardPage = lazy(() => import('./pages/Employee/EmployeeDashboardPage'))
const ApplicationsPage = lazy(() => import('./pages/Employee/ApplicationsPage'))
const InterviewsPage = lazy(() => import('./pages/Employee/InterviewsPage'))
const EmployerDashboardPage = lazy(() => import('./pages/Employer/EmployerDashboardPage'))
const EmployerDashboardEnhanced = lazy(() => import('./pages/Employer/EmployerDashboardEnhanced'))
const JobPostingPage = lazy(() => import('./pages/Employer/JobPostingPage'))
const JobManagementPage = lazy(() => import('./pages/Employer/JobManagementPage'))
const ApplicantsPage = lazy(() => import('./pages/Employer/ApplicantsPage'))
const AnalyticsPage = lazy(() => import('./pages/Employer/AnalyticsPage'))
const CandidateSearchPage = lazy(() => import('./pages/Employer/CandidateSearchPage'))
const CandidateDetailsPage = lazy(() => import('./pages/Employer/CandidateDetailsPage'))
const InterviewSchedulerPage = lazy(() => import('./pages/Employer/InterviewSchedulerPage'))

// Communication pages
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'))
const VideoCallPage = lazy(() => import('./pages/Video/VideoCallPage'))

// Error Pages
import NotFoundPage from './pages/Error/NotFoundPage'
import ErrorPage from './pages/Error/ErrorPage'

const RouteLoadingSkeleton = ({ variant = 'content' }) => {
  if (variant === 'dashboard') {
    return (
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {[1, 2, 3].map((item) => (
          <Card key={item} className="dashboard-card">
            <CardContent>
              <Skeleton variant="text" width="45%" height={28} />
              <Skeleton variant="text" width="75%" height={44} />
            </CardContent>
          </Card>
        ))}
        <Card sx={{ gridColumn: { xs: '1', md: 'span 3' } }} className="dashboard-card">
          <CardContent>
            <Skeleton variant="text" width="25%" height={30} />
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (variant === 'communication') {
    return (
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '320px 1fr' } }}>
        <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Skeleton variant="text" width="35%" height={38} />
      <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
    </Box>
  )
}

function App() {
  const { user, loading } = useAuth()

  useEffect(() => {
    let warmed = false
    const warmNonCriticalRoutes = () => {
      if (warmed) return
      warmed = true

      // Prefetch only opt-in tooling routes after the app is interactive.
      Promise.allSettled([
        import('./pages/Resume/ResumeEditPage')
      ])
    }

    const handleFirstInteraction = () => {
      warmNonCriticalRoutes()
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmNonCriticalRoutes, { timeout: 2500 })
      return () => {
        window.cancelIdleCallback(id)
        window.removeEventListener('pointerdown', handleFirstInteraction)
        window.removeEventListener('keydown', handleFirstInteraction)
      }
    }

    const timeoutId = window.setTimeout(warmNonCriticalRoutes, 2500)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  const renderProtectedRoute = (component, options = {}) => {
    const { withLayout = true, skeleton = 'content' } = options
    const wrappedComponent = <Box className="content-reveal">{component}</Box>

    return (
      <ProtectedRoute>
        <Suspense fallback={<Box className="skeleton-shell"><RouteLoadingSkeleton variant={skeleton} /></Box>}>
          {withLayout ? <Layout>{wrappedComponent}</Layout> : wrappedComponent}
        </Suspense>
      </ProtectedRoute>
    )
  }

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
        element={renderProtectedRoute(
          user?.role === 'employer' ? <EmployerDashboardPage /> : <EmployeeDashboardPage />,
          { skeleton: 'dashboard' }
        )}
      />

      {/* Resume Routes */}
      <Route
        path="/resume/upload"
        element={renderProtectedRoute(<ResumeUploadPage />)}
      />
      
      <Route
        path="/resume/:id"
        element={renderProtectedRoute(<ResumeAnalysisPage />)}
      />
      
      <Route
        path="/resume/:id/analysis"
        element={renderProtectedRoute(<ResumeAnalysisPage />)}
      />
      
      <Route
        path="/resume/:id/edit"
        element={renderProtectedRoute(<ResumeEditPage />)}
      />
      
      <Route
        path="/resume/analysis"
        element={renderProtectedRoute(<ResumeAnalysisPage />)}
      />

      {/* Job Routes */}
      <Route
        path="/jobs/recommendations"
        element={renderProtectedRoute(<JobRecommendationsPage />)}
      />
      
      <Route
        path="/jobs/search"
        element={renderProtectedRoute(<JobSearchPage />)}
      />
      
      <Route
        path="/jobs/:id"
        element={renderProtectedRoute(<JobDetailsPage />)}
      />

      {/* Profile Routes */}
      <Route
        path="/profile"
        element={renderProtectedRoute(<ProfilePage />)}
      />
      
      <Route
        path="/settings"
        element={renderProtectedRoute(<SettingsPage />)}
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={renderProtectedRoute(<EmployeeDashboardPage />, { skeleton: 'dashboard' })}
      />
      
      <Route
        path="/employee/applications"
        element={renderProtectedRoute(<ApplicationsPage />)}
      />
      
      <Route
        path="/employee/interviews"
        element={renderProtectedRoute(<InterviewsPage />)}
      />

      {/* Employer Routes */}
      <Route
        path="/employer/dashboard"
        element={renderProtectedRoute(<EmployerDashboardPage />, { skeleton: 'dashboard' })}
      />

      <Route
        path="/employer/dashboard/enhanced"
        element={renderProtectedRoute(<EmployerDashboardEnhanced />, { skeleton: 'dashboard' })}
      />
      
      <Route
        path="/employer/jobs"
        element={renderProtectedRoute(<JobManagementPage />)}
      />
      
      <Route
        path="/employer/jobs/post"
        element={renderProtectedRoute(<JobPostingPage />)}
      />
      
      <Route
        path="/employer/jobs/:jobId"
        element={renderProtectedRoute(<JobManagementPage />)}
      />
      
      <Route
        path="/employer/jobs/:jobId/applicants"
        element={renderProtectedRoute(<ApplicantsPage />)}
      />
      
      <Route
        path="/employer/analytics"
        element={renderProtectedRoute(<AnalyticsPage />, { skeleton: 'dashboard' })}
      />
      
      <Route
        path="/employer/candidates/search"
        element={renderProtectedRoute(<CandidateSearchPage />)}
      />
      
      <Route
        path="/employer/applications"
        element={renderProtectedRoute(<ApplicantsPage />)}
      />
      
      <Route
        path="/employer/interviews"
        element={renderProtectedRoute(<InterviewSchedulerPage />)}
      />
      
      <Route
        path="/employer/candidates/:id"
        element={renderProtectedRoute(<CandidateDetailsPage />)}
      />
      
      <Route
        path="/employer/interviews/schedule"
        element={renderProtectedRoute(<InterviewSchedulerPage />)}
      />

      {/* Communication Routes */}
      <Route
        path="/chat"
        element={renderProtectedRoute(<ChatPage />, { skeleton: 'communication' })}
      />
      
      <Route
        path="/video/:roomId"
        element={renderProtectedRoute(<VideoCallPage />, { withLayout: false, skeleton: 'communication' })}
      />

      {/* Error Routes */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
