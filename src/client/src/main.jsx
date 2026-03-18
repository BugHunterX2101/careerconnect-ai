import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from 'react-query'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme/theme'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'

import './index.css'
import './styles/animations.css'
import './i18n'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import AppErrorNotifier from './components/shared/AppErrorNotifier'
import queryClient from './utils/queryClient'
import { initializeErrorHandling } from './utils/errorHandler'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { SocketProvider } from './contexts/SocketContext'
import { ResumeProvider } from './contexts/ResumeContext'
import { JobProvider } from './contexts/JobContext'
import { startWebVitalsTracking } from './utils/webVitals'

// Initialize global error handling
initializeErrorHandling();
startWebVitalsTracking();

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typeof window !== 'undefined' && 'loading' in HTMLImageElement.prototype) {
  window.addEventListener('load', () => {
    const images = document.querySelectorAll('img:not([loading])')
    images.forEach((img, index) => {
      // Keep likely above-the-fold imagery eager and lazify the rest.
      if (index > 1) {
        img.setAttribute('loading', 'lazy')
        img.setAttribute('decoding', 'async')
      }
    })
  }, { once: true })
}

const AppProviders = ({ children }) => (
  <AuthProvider>
    <AppProvider>
      <SocketProvider>
        <ResumeProvider>
          <JobProvider>{children}</JobProvider>
        </ResumeProvider>
      </SocketProvider>
    </AppProvider>
  </AuthProvider>
)



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <AppProviders>
                <App />
                <AppErrorNotifier />
                <Toaster
                  position="top-right"
                  gutter={10}
                  toastOptions={{
                    className: 'toast-motion',
                    duration: prefersReducedMotion ? 2800 : 3800,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      borderRadius: '12px',
                      boxShadow: '0 14px 28px rgba(15, 30, 46, 0.22)',
                      transition: prefersReducedMotion
                        ? 'opacity 120ms linear'
                        : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                    },
                    success: {
                      duration: prefersReducedMotion ? 2400 : 3000,
                      iconTheme: {
                        primary: '#4caf50',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: prefersReducedMotion ? 3400 : 4800,
                      iconTheme: {
                        primary: '#f44336',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </AppProviders>
            </ErrorBoundary>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)
