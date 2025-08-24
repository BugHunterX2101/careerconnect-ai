import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SettingsPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account settings and preferences
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will include account settings, privacy controls, notification preferences, and other configuration options.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
