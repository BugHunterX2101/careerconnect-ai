import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Person, Work, School, ContactMail } from '@mui/icons-material';

const CandidateDetailsPage = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Candidate Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View candidate details and qualifications
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            John Doe
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Work color="action" />
            <Typography variant="body1">Senior Software Engineer</Typography>
            <School color="action" />
            <Typography variant="body1">Bachelor's in Computer Science</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will show detailed candidate information, resume, skills, and contact options.
          </Typography>
          <Button variant="contained" startIcon={<ContactMail />}>
            Contact Candidate
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CandidateDetailsPage;
