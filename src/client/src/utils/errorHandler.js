// Global error handling utilities

// Handle unhandled promise rejections
export const handleUnhandledRejection = (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser behavior
  event.preventDefault();
  
  // Log the error for debugging
  if (event.reason && event.reason.message) {
    console.error('Promise rejection details:', event.reason.message);
  }
};

// Handle service worker message channel errors
export const handleServiceWorkerError = (error) => {
  // These errors are usually harmless and can be ignored
  if (error.message && error.message.includes('message channel closed')) {
    console.warn('Service worker message channel closed - this is usually harmless');
    return;
  }
  
  // Log other service worker errors
  console.warn('Service worker error:', error);
};

// Handle fetch errors gracefully
export const handleFetchError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    console.warn('Network request failed - this might be a temporary issue');
    return { error: 'Network error. Please check your connection and try again.' };
  }
  
  console.error('Fetch error:', error);
  return { error: 'An unexpected error occurred. Please try again.' };
};

// Initialize global error handlers
export const initializeErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Handle service worker errors
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('messageerror', handleServiceWorkerError);
    navigator.serviceWorker.addEventListener('error', handleServiceWorkerError);
  }
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    console.warn('Global error caught:', event.error);
    // Prevent default browser error handling
    event.preventDefault();
  });
  
  console.log('Global error handling initialized');
};

// Cleanup error handlers
export const cleanupErrorHandling = () => {
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('messageerror', handleServiceWorkerError);
    navigator.serviceWorker.removeEventListener('error', handleServiceWorkerError);
  }
};
