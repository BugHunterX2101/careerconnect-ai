import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme/theme'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'

import './index.css'
import './styles/animations.css'
import './i18n'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ResumeProvider } from './contexts/ResumeContext'
import { JobProvider } from './contexts/JobContext'
import { AppProvider } from './contexts/AppContext'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import { initializeErrorHandling } from './utils/errorHandler'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Initialize global error handling
initializeErrorHandling();



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <AuthProvider>
                <AppProvider>
                  <SocketProvider>
                    <ResumeProvider>
                      <JobProvider>
                        <App />
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
                      </JobProvider>
                    </ResumeProvider>
                  </SocketProvider>
                </AppProvider>
              </AuthProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)
