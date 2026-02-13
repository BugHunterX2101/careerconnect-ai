import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, LinearProgress } from '@mui/material';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  gradient = 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
  change,
  progress,
  className = '',
  ...props 
}) => {
  return (
    <Card
      className={`hover-lift animate-scale-in ${className}`}
      sx={{
        height: '100%',
        background: gradient,
        color: 'white',
        border: 'none',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
        ...props.sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              width: 56, 
              height: 56,
              backdropFilter: 'blur(10px)',
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9, mb: 1 }}>
          {title}
        </Typography>
        
        {change && (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {change}
          </Typography>
        )}
        
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
              {progress}% Complete
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;