import React, { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { observabilityEvents } from '../../utils/observability';

const AppErrorNotifier = () => {
  const [errorState, setErrorState] = useState({
    open: false,
    message: '',
    source: ''
  });

  useEffect(() => {
    const handler = (event) => {
      const { message = 'Something went wrong', source = 'system' } = event.detail || {};
      setErrorState({
        open: true,
        message,
        source
      });
    };

    window.addEventListener(observabilityEvents.USER_ERROR_EVENT, handler);
    return () => window.removeEventListener(observabilityEvents.USER_ERROR_EVENT, handler);
  }, []);

  const handleClose = () => {
    setErrorState((prev) => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={errorState.open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {errorState.source ? `${errorState.source.toUpperCase()}: ` : ''}
        {errorState.message}
      </Alert>
    </Snackbar>
  );
};

export default AppErrorNotifier;
