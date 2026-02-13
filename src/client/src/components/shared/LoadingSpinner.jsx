import React from 'react';
import { Box, CircularProgress, Typography, alpha } from '@mui/material';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 60, 
  fullScreen = false,
  overlay = false,
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          minHeight: '100vh',
          width: '100%',
        }),
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha('#ffffff', 0.9),
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }),
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CircularProgress
          size={size}
          thickness={4}
          sx={{
            color: 'primary.main',
            animationDuration: '550ms',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
            opacity: 0.1,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </Box>
      
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  return content;
};

export default LoadingSpinner;