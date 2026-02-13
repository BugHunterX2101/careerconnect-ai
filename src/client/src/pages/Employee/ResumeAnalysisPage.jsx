import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Warning,
  TrendingUp,
  School,
  Work,
  Star,
  Lightbulb,
  Assignment
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
const ResumeAnalysisPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumeAnalysis();
  }, [id]);

  const fetchResumeAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/resume/${id}/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        setError('Failed to load resume analysis');
      }
    } catch (error) {
      setError('Error loading analysis');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Analyzing your resume...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Resume Analysis Results
      </Typography>

      {/* Overall Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color={getScoreColor(analysis?.overallScore || 0)}>
                  {analysis?.overallScore || 0}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {analysis?.detailedAnalysis?.overallAssessment || 'Resume analysis completed'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completeness: {analysis?.completeness || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis?.completeness || 0} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('resume.analysis.skillsRelevance')}: {analysis?.skillsRelevance || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis?.skillsRelevance || 0} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('resume.analysis.experienceDepth')}: {analysis?.experienceDepth || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis?.experienceDepth || 0} 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Strengths */}
      {analysis?.detailedAnalysis?.strengths && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              Your Strengths
            </Typography>
            <Grid container spacing={1}>
              {analysis.detailedAnalysis.strengths.map((strength, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={strength} 
                    color="success" 
                    variant="outlined"
                    icon={<Star />}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Improvement Areas */}
      {analysis?.improvementAreas && analysis.improvementAreas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              Areas for Improvement
            </Typography>
            {analysis.improvementAreas.map((area, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {area.area}
                    </Typography>
                    <Chip 
                      label={area.priority} 
                      color={getPriorityColor(area.priority)}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Issue:</strong> {area.issue}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Suggestion:</strong> {area.suggestion}
                    </Typography>
                    {area.examples && area.examples.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Examples:</strong>
                        </Typography>
                        <List dense>
                          {area.examples.map((example, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <Lightbulb color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={example} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Gaps */}
      {analysis?.detailedAnalysis?.skillGaps && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <School color="info" sx={{ mr: 1 }} />
              Recommended Skills to Learn
            </Typography>
            <Grid container spacing={1}>
              {analysis.detailedAnalysis.skillGaps.map((skill, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={skill} 
                    color="info" 
                    variant="outlined"
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Industry Trends */}
      {analysis?.detailedAnalysis?.industryTrends && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUp color="secondary" sx={{ mr: 1 }} />
              Industry Trends to Consider
            </Typography>
            <List>
              {analysis.detailedAnalysis.industryTrends.map((trend, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingUp color="secondary" />
                  </ListItemIcon>
                  <ListItemText primary={trend} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {analysis?.detailedAnalysis?.actionItems && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Assignment color="primary" sx={{ mr: 1 }} />
              Next Steps
            </Typography>
            <List>
              {analysis.detailedAnalysis.actionItems.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Assignment color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.href = '/resume/upload'}
        >
          {t('resume.upload.button')}
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => window.location.href = '/jobs/recommendations'}
        >
          {t('jobs.recommendations.button')}
        </Button>
      </Box>
    </Box>
  );
};

export default ResumeAnalysisPage;