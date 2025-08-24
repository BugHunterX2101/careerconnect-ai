import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const JobSearchPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Job Search
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Search and filter job opportunities
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Advanced Job Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will include advanced search filters, job listings, and application functionality.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobSearchPage;
