import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { Business, People, Work, Assessment } from '@mui/icons-material';

const EmployerDashboardPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Employer Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your recruitment and hiring process
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Active Jobs</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>12</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Applications</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>156</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Interviews</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>8</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Hired</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>3</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployerDashboardPage;
