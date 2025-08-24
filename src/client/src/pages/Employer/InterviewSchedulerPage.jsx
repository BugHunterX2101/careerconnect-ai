import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Schedule, VideoCall } from '@mui/icons-material';

const InterviewSchedulerPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Schedule Interviews
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Schedule and manage candidate interviews
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ mr: 1 }} />
            Interview Scheduler
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will provide tools to schedule interviews, send invitations, and manage the interview process.
          </Typography>
          <Button variant="contained" startIcon={<VideoCall />}>
            Schedule Interview
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InterviewSchedulerPage;
