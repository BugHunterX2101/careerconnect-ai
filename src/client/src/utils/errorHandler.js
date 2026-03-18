// Global error handler for browser extension conflicts and other errors
import { reportClientEvent } from './observability';

export const initializeErrorHandling = () => {
  // Handle browser extension errors
  window.addEventListener('error', (event) => {
    // Ignore browser extension errors
    if (event.filename && (
      event.filename.includes('extension://') ||
      event.filename.includes('content-all.js') ||
      event.filename.includes('chrome-extension://')
    )) {
      event.preventDefault();
      return false;
    }

    reportClientEvent('window_error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Ignore browser extension promise rejections
    if (event.reason && event.reason.message && 
        event.reason.message.includes('Could not establish connection')) {
      event.preventDefault();
      return false;
    }

    reportClientEvent('unhandled_rejection', {
      message: event.reason?.message || String(event.reason || 'unknown')
    });
  });

  // Suppress console errors from browser extensions and WebSocket
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('content-all.js')) {
      return; // Suppress extension and WebSocket errors
    }

    reportClientEvent('console_error', { message });
    originalConsoleError.apply(console, args);
  };
};

export default { initializeErrorHandling };