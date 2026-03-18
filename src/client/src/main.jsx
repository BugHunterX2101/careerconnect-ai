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
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4caf50',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
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
