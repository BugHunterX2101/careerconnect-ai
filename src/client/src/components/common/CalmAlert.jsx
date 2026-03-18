import React from 'react';
import { Alert } from '@mui/material';

const CalmAlert = ({ severity = 'info', sx = {}, ...props }) => {
  return (
    <Alert
      severity={severity}
      className={`system-alert ${severity}`}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiAlert-message': { fontWeight: 500 },
        ...sx,
      }}
      {...props}
    />
  );
};

export default CalmAlert;
