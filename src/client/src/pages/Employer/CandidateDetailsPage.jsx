import React from 'react';
import { Box, Typography, Card, CardContent, Button, IconButton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Work, School, ContactMail, ArrowBack } from '@mui/icons-material';

const CandidateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Candidate Profile
        </Typography>
      </Box>
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<ContactMail />}>
              Contact Candidate
            </Button>
            <Button variant="outlined" onClick={() => navigate('/employer/candidates/search')}>
              Back to Search
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CandidateDetailsPage;
