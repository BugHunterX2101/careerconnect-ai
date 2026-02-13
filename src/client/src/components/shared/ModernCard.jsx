import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, alpha, useTheme } from '@mui/material';

const ModernCard = ({ 
  title, 
  subtitle, 
  icon, 
  gradient, 
  children, 
  action,
  stats,
  className = '',
  ...props 
}) => {
  const theme = useTheme();

  return (
    <Card
      className={`hover-lift ${className}`}
      sx={{
        borderRadius: 3,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        ...props.sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        {(title || icon) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: title ? 2 : 0 }}>
            {icon && (
              <Avatar
                sx={{
                  background: gradient || 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                  mr: title ? 2 : 0,
                  width: 48,
                  height: 48,
                }}
              >
                {icon}
              </Avatar>
            )}
            {title && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
            {action && (
              <Box>
                {action}
              </Box>
            )}
          </Box>
        )}

        {/* Stats */}
        {stats && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
              {stats.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.label}
            </Typography>
            {stats.change && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: stats.change.startsWith('+') ? 'success.main' : 'error.main',
                  fontWeight: 600,
                }}
              >
                {stats.change}
              </Typography>
            )}
          </Box>
        )}

        {/* Content */}
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;