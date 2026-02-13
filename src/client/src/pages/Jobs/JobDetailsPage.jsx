import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Work, LocationOn, Business, Send } from '@mui/icons-material';

const JobDetailsPage = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Job Details
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Detailed information about job opportunity
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Senior Software Engineer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Business color="action" />
            <Typography variant="body1">Tech Corp</Typography>
            <LocationOn color="action" />
            <Typography variant="body1">San Francisco, CA</Typography>
            <Work color="action" />
            <Typography variant="body1">Full-time</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will show detailed job information, requirements, benefits, and application options.
          </Typography>
                  <Button variant="contained" startIcon={<Send />}>
          Apply Now
        </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobDetailsPage;
