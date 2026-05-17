import React from 'react';
import { Box, Typography, Card, CardContent, Button, IconButton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowBack } from '@mui/icons-material';

const ResumeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Edit Resume
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Edit and update your resume information
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resume Editor
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will provide an interface to edit resume content, skills, experience, and other details.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<Save />}>
              Save Changes
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResumeEditPage;
