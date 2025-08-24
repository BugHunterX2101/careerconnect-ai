import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const JobPostingPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Post New Job
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create and publish a new job opportunity
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Job Posting Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will include a comprehensive form for creating job postings with all necessary details.
          </Typography>
          <Button variant="contained" startIcon={<Add />}>
            Create Job Post
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobPostingPage;
