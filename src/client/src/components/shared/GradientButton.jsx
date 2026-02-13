import React from 'react';
import { Button, alpha } from '@mui/material';

const GradientButton = ({ 
  children, 
  gradient = 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
  hoverGradient = 'linear-gradient(135deg, #6B5544 0%, #4A3F35 100%)',
  variant = 'contained',
  className = '',
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      className={`${className}`}
      sx={{
        background: variant === 'contained' ? gradient : 'transparent',
        color: variant === 'contained' ? 'white' : 'primary.main',
        fontWeight: 700,
        textTransform: 'none',
        borderRadius: 2,
        px: 4,
        py: 1.5,
        fontSize: '1.375rem',
        border: variant === 'outlined' ? '2px solid' : 'none',
        borderColor: variant === 'outlined' ? 'primary.main' : 'transparent',
        boxShadow: variant === 'contained' ? '0 8px 25px rgba(139, 111, 71, 0.3)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: variant === 'contained' ? hoverGradient : alpha('#8B6F47', 0.1),
          transform: 'translateY(-3px)',
          boxShadow: variant === 'contained' 
            ? '0 15px 35px rgba(139, 111, 71, 0.4)' 
            : '0 8px 25px rgba(139, 111, 71, 0.2)',
          borderColor: variant === 'outlined' ? 'primary.dark' : 'transparent',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default GradientButton;