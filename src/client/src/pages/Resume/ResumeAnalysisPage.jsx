import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import { TrendingUp, Work, School, Star } from '@mui/icons-material';

const ResumeAnalysisPage = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Resume Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AI-powered analysis of your resume
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Skills Analysis
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label="JavaScript" color="primary" />
                <Chip label="React" color="primary" />
                <Chip label="Node.js" color="primary" />
                <Chip label="Python" color="primary" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                This page will show detailed AI analysis of skills, experience, and recommendations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 1 }} />
                AI Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This section will display AI-powered recommendations for improving your resume and career prospects.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResumeAnalysisPage;
