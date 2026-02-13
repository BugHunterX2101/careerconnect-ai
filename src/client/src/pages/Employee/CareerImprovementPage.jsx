import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails, Chip, List,
  ListItem, ListItemIcon, ListItemText, LinearProgress,
  Alert, CircularProgress, Tabs, Tab, Avatar, Divider,
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, IconButton, Tooltip
} from '@mui/material';
import {
  ExpandMore, TrendingUp, School, Work, Psychology,
  AttachMoney, NetworkCheck, Description, VideoCall,
  Star, CheckCircle, Schedule, Lightbulb, Target,
  Assessment, BookmarkBorder, Bookmark, Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const CareerImprovementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [savedSuggestions, setSavedSuggestions] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCareerSuggestions();
  }, []);

  const fetchCareerSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get user's resume data for BERT analysis
      const token = localStorage.getItem('token');
      let bertKeywords = null;

      // Try to get existing resume analysis
      try {
        const resumeResponse = await fetch('http://localhost:3000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resumeResponse.ok) {
          const profileData = await resumeResponse.json();
          // Use profile skills as BERT keywords if available
          if (profileData.profile?.skills) {
            bertKeywords = {
              technical: profileData.profile.skills,
              roles: [profileData.profile.title || 'developer'],
              experience: profileData.profile.experience?.years || 0,
              skills: profileData.profile.skills
            };
          }
        }
      } catch (error) {
        console.warn('Could not fetch profile data:', error);
      }

      // If no BERT keywords from profile, use mock data
      if (!bertKeywords) {
        bertKeywords = {
          technical: ['javascript', 'react', 'node.js', 'python'],
          roles: ['developer'],
          experience: 3,
          skills: ['javascript', 'react', 'node.js', 'python', 'sql']
        };
      }

      // Get career improvement suggestions
      const response = await fetch('http://localhost:3000/api/ml/career-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bertKeywords,
          profileData: {
            experience: { years: bertKeywords.experience },
            skills: bertKeywords.skills,
            location: 'Remote'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data);
      } else {
        setError('Failed to fetch career suggestions');
      }
    } catch (error) {
      console.error('Error fetching career suggestions:', error);
      setError('Failed to load career improvement suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveSuggestion = (suggestionId) => {
    setSavedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info';
  };

  const renderSkillGaps = () => (
    <Grid container spacing={3}>
      {suggestions?.skillGaps?.map((gap, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {gap.category}
                </Typography>
                <Chip 
                  label={`${gap.priority}/10 Priority`}
                  color={getPriorityColor(gap.marketDemand)}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Market Demand: {gap.marketDemand}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Missing Skills:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {gap.missingSkills.map((skill, idx) => (
                    <Chip key={idx} label={skill} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Learning Time: {gap.learningTime}</Typography>
                <Typography variant="body2" color="primary">Salary Impact: {gap.salaryImpact}</Typography>
              </Box>
              
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<School />}
                fullWidth
              >
                Start Learning
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCareerPaths = () => (
    <Grid container spacing={3}>
      {suggestions?.careerPaths?.map((path, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{path.path}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>{path.probability}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={path.probability} 
                    sx={{ width: 60, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
              
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {path.nextRole}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Timeframe: {path.timeframe} | Salary Increase: {path.salaryIncrease}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Requirements:</Typography>
              <List dense>
                {path.requirements.map((req, idx) => (
                  <ListItem key={idx} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircle fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={req} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Target />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Set as Goal
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderLearningPlan = () => (
    <Box>
      <Timeline>
        {/* Immediate Learning */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="error">
              <Schedule />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6" gutterBottom>Immediate (0-3 months)</Typography>
            <Grid container spacing={2}>
              {suggestions?.learningRecommendations?.immediate?.map((item, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>{item.skill}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.reason}
                      </Typography>
                      <Chip label={item.difficulty} size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Time: {item.timeCommitment}
                      </Typography>
                      <List dense>
                        {item.resources.map((resource, idx) => (
                          <ListItem key={idx} sx={{ py: 0, pl: 0 }}>
                            <ListItemText 
                              primary={resource}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TimelineContent>
        </TimelineItem>

        {/* Short-term Learning */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="warning">
              <School />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6" gutterBottom>Short-term (3-6 months)</Typography>
            <Grid container spacing={2}>
              {suggestions?.learningRecommendations?.shortTerm?.map((item, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>{item.skill}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.reason}
                      </Typography>
                      <Chip label={item.difficulty} size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Time: {item.timeCommitment}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TimelineContent>
        </TimelineItem>

        {/* Long-term Learning */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="success">
              <TrendingUp />
            </TimelineDot>
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6" gutterBottom>Long-term (6-12 months)</Typography>
            <Grid container spacing={2}>
              {suggestions?.learningRecommendations?.longTerm?.map((item, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>{item.skill}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.reason}
                      </Typography>
                      <Chip label={item.difficulty} size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Time: {item.timeCommitment}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TimelineContent>
        </TimelineItem>
      </Timeline>

      {/* Certifications */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Recommended Certifications</Typography>
        <Grid container spacing={2}>
          {suggestions?.learningRecommendations?.certifications?.map((cert, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>{cert.name}</Typography>
                  <Chip 
                    label={cert.priority} 
                    color={getPriorityColor(cert.priority)} 
                    size="small" 
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" gutterBottom>
                    Time: {cert.timeToComplete}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    Salary Impact: {cert.salaryImpact}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const renderSalaryOptimization = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Salary Analysis</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Current Estimate</Typography>
              <Typography variant="h4" color="primary">
                ${suggestions?.salaryOptimization?.currentEstimate?.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Optimized Potential</Typography>
              <Typography variant="h4" color="success.main">
                ${suggestions?.salaryOptimization?.optimizedPotential?.toLocaleString()}
              </Typography>
            </Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Potential increase: ${suggestions?.salaryOptimization?.increaseOpportunity?.toLocaleString()} 
              ({suggestions?.salaryOptimization?.percentageIncrease}%)
            </Alert>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Optimization Strategies</Typography>
            <List>
              {suggestions?.salaryOptimization?.strategies?.map((strategy, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AttachMoney color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={strategy.strategy}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Impact: {strategy.impact} | Timeframe: {strategy.timeframe}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strategy.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Negotiation Tips</Typography>
            <List>
              {suggestions?.salaryOptimization?.negotiationTips?.map((tip, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={tip} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderMarketInsights = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Trending Skills</Typography>
            <List>
              {suggestions?.marketInsights?.trendingSkills?.map((skill, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={skill.skill}
                    secondary={`Growth: ${skill.growth} | Demand: ${skill.demand} | Avg Salary: ${skill.avgSalary}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Industry Growth</Typography>
            <List>
              {suggestions?.marketInsights?.industryGrowth?.map((industry, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Assessment color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={industry.industry}
                    secondary={`Growth: ${industry.growth} | Hiring: ${industry.hiring}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Your Skills Market Value</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">
                Current Skills Value: <strong>${suggestions?.marketInsights?.salaryTrends?.yourSkills?.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body1">
                Market Average: <strong>{suggestions?.marketInsights?.salaryTrends?.marketAverage}</strong>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Growth Potential: {suggestions?.marketInsights?.salaryTrends?.growthPotential}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={fetchCareerSuggestions} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Career Improvement</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {suggestions?.overallScore || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Career Score
            </Typography>
          </Box>
          <Button onClick={fetchCareerSuggestions} startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Box>

      {suggestions?.priorityActions && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Priority Actions:</Typography>
          {suggestions.priorityActions.map((action, index) => (
            <Typography key={index} variant="body2">
              • {action.action} (Impact: {action.impact}, Timeframe: {action.timeframe})
            </Typography>
          ))}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Skill Gaps" icon={<Psychology />} />
        <Tab label="Career Paths" icon={<Work />} />
        <Tab label="Learning Plan" icon={<School />} />
        <Tab label="Salary Optimization" icon={<AttachMoney />} />
        <Tab label="Market Insights" icon={<TrendingUp />} />
      </Tabs>

      {activeTab === 0 && renderSkillGaps()}
      {activeTab === 1 && renderCareerPaths()}
      {activeTab === 2 && renderLearningPlan()}
      {activeTab === 3 && renderSalaryOptimization()}
      {activeTab === 4 && renderMarketInsights()}
    </Box>
  );
};

export default CareerImprovementPage;