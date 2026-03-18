import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Chip, LinearProgress, Paper, Tab, Tabs, Alert,
  IconButton, Tooltip, Divider
} from '@mui/material';
import {
  Work, Assessment, Schedule, TrendingUp, Add, Search,
  Description, Visibility, Chat, VideoCall, Star,
  LocationOn, Business, CalendarToday, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { MetricChip, SignatureCard, TrendBadge } from '../../components/common';
const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, applicationsData, interviewsData, recommendationsData] = await Promise.all([
        employeeService.getDashboardStats(),
        employeeService.getApplications({ limit: 5 }),
        employeeService.getInterviews({ limit: 5, status: 'scheduled' }),
        employeeService.getJobRecommendations({ limit: 5 })
      ]);
      
      setStats(statsData);
      setRecentApplications(applicationsData.applications || []);
      setUpcomingInterviews(interviewsData.interviews || []);
      setJobRecommendations(recommendationsData.jobs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'search-jobs':
        navigate('/jobs/search');
        break;
      case 'upload-resume':
        navigate('/resume/upload');
        break;
      case 'view-applications':
        navigate('/employee/applications');
        break;
      case 'view-interviews':
        navigate('/employee/interviews');
        break;
      default:
        break;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'shortlisted': return 'primary';
      case 'interview': return 'secondary';
      case 'hired': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };



  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box className="motion-page-enter">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, fontSize: '2.05rem', color: 'text.primary', letterSpacing: '-0.5px' }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '650px' }}>
            {t('dashboard.welcomeMessage', 'Your AI-powered career dashboard with GPT-enhanced job matching, LinkedIn integration, and comprehensive resume analysis')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <MetricChip label="Role-fit scoring" />
            <MetricChip label="Interview readiness" color="success" />
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<TrendingUp sx={{ fontSize: 28 }} />}
          onClick={() => navigate('/jobs/recommendations')}
          size="large"
          sx={{ 
            background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
            color: '#FAF3E0',
            py: 2,
            px: 4,
            fontSize: '1.125rem',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.3px',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6B5544 0%, #8B6F47 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(139, 111, 71, 0.25)'
            },
            transition: 'all 0.25s ease'
          }}
        >
          Generate High-Fit Matches
        </Button>
      </Box>

      {/* AI-Powered Quick Actions */}
      <Paper className="dashboard-highlight-panel" sx={{ 
        p: 3, 
        mb: 3,
        border: '1px solid rgba(15, 95, 204, 0.16)',
        borderRadius: 2,
        boxShadow: '0 10px 28px rgba(27, 43, 59, 0.08)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: 'text.primary', mb: 1 }}>AI-Powered Quick Actions</Typography>
        <TrendBadge direction="up" label="Personalized for your recent profile activity" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUp sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/jobs/recommendations')}
              sx={{ 
                color: '#8B6F47', 
                borderColor: 'rgba(139, 111, 71, 0.3)',
                borderWidth: 1,
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#8B6F47',
                  background: 'rgba(139, 111, 71, 0.05)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              AI Job Recommendations
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Search sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/jobs/search')}
              sx={{ 
                color: '#6B5544', 
                borderColor: 'rgba(107, 85, 68, 0.3)',
                borderWidth: 1,
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#6B5544',
                  background: 'rgba(107, 85, 68, 0.05)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {t('dashboard.gptJobSearch', 'GPT Job Search')}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Assessment sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/resume/analysis')}
              sx={{ 
                color: '#A67C52', 
                borderColor: 'rgba(166, 124, 82, 0.3)',
                borderWidth: 1,
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#A67C52',
                  background: 'rgba(166, 124, 82, 0.05)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {t('dashboard.resumeAnalysis', 'Resume Analysis')}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Chat sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/chat')}
              sx={{ 
                color: '#8B6F47', 
                borderColor: 'rgba(139, 111, 71, 0.3)',
                borderWidth: 1,
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#8B6F47',
                  background: 'rgba(139, 111, 71, 0.05)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Chat & Network
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <SignatureCard sx={{ 
            cursor: 'pointer',
            borderRadius: 2,
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 16px rgba(27, 43, 59, 0.12)',
              borderColor: 'rgba(15, 95, 204, 0.25)'
            }
          }} onClick={() => navigate('/employee/applications')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Job Applications</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalApplications || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.pendingApplications || 0} pending
              </Typography>
            </CardContent>
          </SignatureCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
            border: '1px solid rgba(139, 111, 71, 0.12)',
            borderRadius: 2,
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 16px rgba(139, 111, 71, 0.12)',
              borderColor: 'rgba(139, 111, 71, 0.25)'
            }
          }} onClick={() => navigate('/employee/interviews')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1.5, color: '#6B5544', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Interviews</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalInterviews || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.upcomingInterviews || 0} upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
            border: '1px solid rgba(139, 111, 71, 0.12)',
            borderRadius: 2,
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 16px rgba(139, 111, 71, 0.12)',
              borderColor: 'rgba(139, 111, 71, 0.25)'
            }
          }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1.5, color: '#A67C52', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Profile Views</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.profileViews || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.weeklyViews || 0} this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
            border: '1px solid rgba(139, 111, 71, 0.12)',
            borderRadius: 2,
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 16px rgba(139, 111, 71, 0.12)',
              borderColor: 'rgba(139, 111, 71, 0.25)'
            }
          }} onClick={() => navigate('/jobs/recommendations')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>AI Match Score</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.jobMatches || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '0.875rem' }}>
                {stats?.newMatches || 0} new matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#8B6F47',
              py: 2,
              textTransform: 'none',
              letterSpacing: '0.3px',
              '&.Mui-selected': {
                color: '#6B5544',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6B5544',
              height: 2
            }
          }}
        >
          <Tab label="Recent Activity" />
          <Tab label="Job Recommendations" />
          <Tab label="Upcoming Interviews" />
        </Tabs>
        
        {/* Recent Activity Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Recent Applications */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
                  <Work sx={{ mr: 2, fontSize: 28 }} />
                  Recent Applications
                </Typography>
                <List>
                  {recentApplications.map((application) => (
                    <ListItem key={application._id} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#8B6F47', width: 48, height: 48 }}>
                          <Business />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6B5544' }}>{application.job?.title}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem', mt: 0.5 }}>
                              {application.job?.company} • {application.job?.location}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Chip 
                                size="medium" 
                                label={application.status} 
                                color={getStatusColor(application.status)}
                                sx={{ fontSize: '1rem', fontWeight: 600 }}
                              />
                              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem', alignSelf: 'center' }}>
                                Applied {formatDate(application.appliedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {recentApplications.length === 0 && (
                    <ListItem sx={{ p: 3 }}>
                      <ListItemText 
                        primary={<Typography variant="h6" sx={{ color: '#6B5544', fontSize: '1rem' }}>No applications yet</Typography>}
                        secondary={<Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>Start applying to jobs to see them here</Typography>}
                      />
                    </ListItem>
                  )}
                </List>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate('/employee/applications')}
                  sx={{
                    borderColor: '#8B6F47',
                    color: '#8B6F47',
                    borderWidth: 2,
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    mt: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#6B5544',
                      background: 'rgba(139, 111, 71, 0.08)'
                    }
                  }}
                >
                  View All Applications
                </Button>
              </Grid>

              {/* Profile Completion */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>Profile Completion</Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#6B5544', fontWeight: 600 }}>Profile Strength</Typography>
                    <Typography variant="body1" sx={{ fontSize: '1rem', color: '#8B6F47', fontWeight: 700 }}>{stats?.profileCompletion || 0}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.profileCompletion || 0} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      background: 'rgba(139, 111, 71, 0.15)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #8B6F47 0%, #6B5544 100%)',
                        borderRadius: 6
                      }
                    }}
                  />
                </Box>
                
                {stats?.profileSuggestions?.map((suggestion, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 2, fontSize: '1.125rem', borderLeft: '4px solid #8B6F47' }}>
                    {suggestion}
                  </Alert>
                ))}
                
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate('/profile')}
                  sx={{
                    borderColor: '#8B6F47',
                    color: '#8B6F47',
                    borderWidth: 2,
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    mt: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#6B5544',
                      background: 'rgba(139, 111, 71, 0.08)'
                    }
                  }}
                >
                  Complete Profile
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Job Recommendations Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>Recommended Jobs</Typography>
            <List>
              {jobRecommendations.map((job) => (
                <ListItem key={job._id} sx={{ 
                  border: 2, 
                  borderColor: 'rgba(139, 111, 71, 0.3)', 
                  borderRadius: 3, 
                  mb: 2,
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(250, 243, 224, 0.5) 0%, rgba(245, 230, 211, 0.5) 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(139, 111, 71, 0.2)'
                  }
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#8B6F47', width: 56, height: 56 }}>
                      <Business sx={{ fontSize: 32 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#6B5544' }}>{job.title}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47', mt: 1 }}>{job.company}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                          <LocationOn sx={{ fontSize: 20, color: '#8B6F47' }} />
                          <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47' }}>{job.location}</Typography>
                          <Chip size="medium" label={`${job.matchScore}% match`} sx={{ bgcolor: '#A67C52', color: '#FAF3E0', fontWeight: 700, fontSize: '1rem' }} />
                        </Box>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="View Job">
                      <IconButton onClick={() => navigate(`/jobs/${job._id}`)} sx={{ color: '#8B6F47' }}>
                        <Visibility sx={{ fontSize: 28 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Save Job">
                      <IconButton sx={{ color: '#D4BA94' }}>
                        <Star sx={{ fontSize: 28 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/jobs/recommendations')}
              sx={{
                borderColor: '#8B6F47',
                color: '#8B6F47',
                borderWidth: 2,
                py: 2.5,
                fontSize: '1.125rem',
                fontWeight: 600,
                mt: 3,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#6B5544',
                  background: 'rgba(139, 111, 71, 0.08)'
                }
              }}
            >
              View All Recommendations
            </Button>
          </Box>
        )}

        {/* Upcoming Interviews Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>Upcoming Interviews</Typography>
            <List>
              {upcomingInterviews.map((interview) => (
                <ListItem key={interview._id} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#6B5544', width: 48, height: 48 }}>
                      <Schedule />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6B5544' }}>{interview.job?.title}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47', mt: 0.5 }}>{interview.job?.company}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '1rem', color: '#8B6F47', mt: 1 }}>
                          {formatDate(interview.scheduledAt)} • {interview.duration} min
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {interview.type === 'video' && interview.meetLink && (
                      <Tooltip title="Join Video Call">
                        <IconButton onClick={() => window.open(interview.meetLink, '_blank')} sx={{ color: '#8B6F47' }}>
                          <VideoCall sx={{ fontSize: 28 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Message Interviewer">
                      <IconButton onClick={() => navigate(`/chat?user=${interview.interviewer._id}`)} sx={{ color: '#8B6F47' }}>
                        <Chat sx={{ fontSize: 28 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
              {upcomingInterviews.length === 0 && (
                <ListItem sx={{ p: 3 }}>
                  <ListItemText 
                    primary={<Typography variant="h6" sx={{ color: '#6B5544', fontSize: '1rem' }}>No upcoming interviews</Typography>}
                    secondary={<Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>Interviews will appear here when scheduled</Typography>}
                  />
                </ListItem>
              )}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/employee/interviews')}
              sx={{
                borderColor: '#8B6F47',
                color: '#8B6F47',
                borderWidth: 2,
                py: 2,
                fontSize: '1.125rem',
                fontWeight: 600,
                mt: 2,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#6B5544',
                  background: 'rgba(139, 111, 71, 0.08)'
                }
              }}
            >
              View All Interviews
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EmployeeDashboardPage;
