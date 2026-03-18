import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Grid, Button, Tabs, Tab,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip,
  LinearProgress, Paper, Alert, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Badge
} from '@mui/material';
import {
  Work, Assessment, Schedule, TrendingUp, Add, Search, Notifications,
  Description, Visibility, Chat, VideoCall, Star, LocationOn, Business,
  CalendarToday, CheckCircle, School, Psychology, Timeline, Settings,
  NotificationsActive, BookmarkBorder, Bookmark, Share, Download,
  Analytics, TrendingDown, ArrowUpward, ArrowDownward, Speed,
  EmojiEvents, PersonSearch, AutoAwesome, Lightbulb, Target
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboardEnhanced = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // State management
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [skillRecommendations, setSkillRecommendations] = useState(null);
  const [jobAlerts, setJobAlerts] = useState(null);
  const [resumeInsights, setResumeInsights] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', criteria: {}, frequency: 'daily' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsData, analyticsData, skillsData, alertsData, resumeData,
        notificationsData, applicationsData, interviewsData, recommendationsData
      ] = await Promise.all([
        employeeService.getDashboardStats(),
        employeeService.getAnalytics(),
        employeeService.getSkillRecommendations(),
        employeeService.getJobAlerts(),
        employeeService.getResumeInsights(),
        employeeService.getNotifications(),
        employeeService.getApplications({ limit: 5 }),
        employeeService.getInterviews({ limit: 5, status: 'scheduled' }),
        employeeService.getJobRecommendations({ limit: 5 })
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setSkillRecommendations(skillsData);
      setJobAlerts(alertsData);
      setResumeInsights(resumeData);
      setNotifications(notificationsData.notifications || []);
      setRecentApplications(applicationsData.applications || []);
      setUpcomingInterviews(interviewsData.interviews || []);
      setJobRecommendations(recommendationsData.jobs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJobAlert = async () => {
    try {
      await employeeService.createJobAlert(newAlert);
      setAlertDialogOpen(false);
      setNewAlert({ title: '', criteria: {}, frequency: 'daily' });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating job alert:', error);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ ml: 2 }}>Loading Enhanced Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, fontSize: '2.2rem', color: '#6B5544', letterSpacing: '-0.5px' }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1rem', lineHeight: 1.6, maxWidth: '650px' }}>
            Your AI-powered career command center with advanced analytics, personalized insights, and smart recommendations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
            <IconButton size="large" sx={{ bgcolor: 'rgba(139, 111, 71, 0.1)' }}>
              <NotificationsActive sx={{ fontSize: 28, color: '#8B6F47' }} />
            </IconButton>
          </Badge>
          <Button 
            variant="contained" 
            startIcon={<AutoAwesome sx={{ fontSize: 28 }} />}
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
            AI Job Matching
          </Button>
        </Box>
      </Box>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
          }} onClick={() => navigate('/employee/applications')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Applications</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalApplications || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.pendingApplications || 0} pending
                </Typography>
                {analytics?.applicationTrends?.growth && (
                  <Chip 
                    size="small" 
                    label={analytics.applicationTrends.growth} 
                    color="success"
                    icon={<ArrowUpward sx={{ fontSize: 16 }} />}
                  />
                )}
              </Box>
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
          }} onClick={() => navigate('/employee/interviews')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1.5, color: '#6B5544', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Interviews</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalInterviews || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.upcomingInterviews || 0} upcoming
                </Typography>
                <Chip 
                  size="small" 
                  label={`${analytics?.interviewConversion?.rate || 0}% success`} 
                  color="info"
                />
              </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.weeklyViews || 0} this week
                </Typography>
                {analytics?.profileViews?.growth && (
                  <Chip 
                    size="small" 
                    label={analytics.profileViews.growth} 
                    color="success"
                    icon={<ArrowUpward sx={{ fontSize: 16 }} />}
                  />
                )}
              </Box>
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
                <Speed sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Match Score</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {resumeInsights?.score || 0}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                Resume strength
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Enhanced */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 2.5 }}>
          Smart Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AutoAwesome sx={{ fontSize: 24 }} />}
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
              AI Matching
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Psychology sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/employee/skill-recommendations')}
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
              Skill Insights
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
              Resume AI
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<NotificationsActive sx={{ fontSize: 24 }} />}
              onClick={() => setAlertDialogOpen(true)}
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
              Job Alerts
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Analytics sx={{ fontSize: 24 }} />}
              onClick={() => setTabValue(4)}
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
              Analytics
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Tabs */}
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
          <Tab label="Dashboard Overview" />
          <Tab label="Job Recommendations" />
          <Tab label="Skill Development" />
          <Tab label="Career Insights" />
          <Tab label="Analytics" />
        </Tabs>
        
        {/* Dashboard Overview Tab */}
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

              {/* Profile & Resume Insights */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
                  Profile & Resume Insights
                </Typography>
                
                {/* Profile Completion */}
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

                {/* Resume Score */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#6B5544', fontWeight: 600 }}>Resume Score</Typography>
                    <Typography variant="body1" sx={{ fontSize: '1rem', color: '#8B6F47', fontWeight: 700 }}>{resumeInsights?.score || 0}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={resumeInsights?.score || 0} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      background: 'rgba(139, 111, 71, 0.15)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #A67C52 0%, #8B6F47 100%)',
                        borderRadius: 6
                      }
                    }}
                  />
                </Box>

                {/* Quick Improvements */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Quick Improvements</Typography>
                {resumeInsights?.improvements?.slice(0, 3).map((improvement, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 2, fontSize: '1.125rem', borderLeft: '4px solid #8B6F47' }}>
                    {improvement}
                  </Alert>
                ))}
                
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate('/resume/analysis')}
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
                  Full Resume Analysis
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Job Recommendations Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              AI-Powered Job Recommendations
            </Typography>
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

        {/* Skill Development Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              Skill Development Recommendations
            </Typography>
            
            {/* Trending Skills */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Trending Skills</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {skillRecommendations?.trending?.map((skill, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ p: 2, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{skill.skill}</Typography>
                    <Typography variant="body2" sx={{ color: '#8B6F47' }}>Growth: {skill.growth}</Typography>
                    <Typography variant="body2" sx={{ color: '#8B6F47' }}>Avg Salary: {skill.avgSalary}</Typography>
                    <Chip size="small" label={skill.demand} color={skill.demand === 'High' ? 'success' : 'info'} sx={{ mt: 1 }} />
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Personalized Recommendations */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Personalized for You</Typography>
            <List>
              {skillRecommendations?.personalized?.map((skill, index) => (
                <ListItem key={index} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#A67C52' }}>
                      <Lightbulb />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{skill.skill}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ color: '#8B6F47' }}>{skill.reason}</Typography>
                        <Typography variant="body2" sx={{ color: '#8B6F47' }}>Time to learn: {skill.timeToLearn}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Learning Paths */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Learning Paths</Typography>
            <Grid container spacing={3}>
              {skillRecommendations?.learningPaths?.map((path, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ p: 3, border: '2px solid rgba(139, 111, 71, 0.3)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#6B5544', mb: 2 }}>{path.title}</Typography>
                    <Box sx={{ mb: 2 }}>
                      {path.skills.map((skill, skillIndex) => (
                        <Chip key={skillIndex} label={skill} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B6F47' }}>Duration: {path.duration}</Typography>
                    <Typography variant="body2" sx={{ color: '#8B6F47' }}>Salary Increase: {path.salaryIncrease}</Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 2 }}>Start Learning</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Career Insights Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              Career Insights & Market Intelligence
            </Typography>
            
            {/* Job Alerts */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Active Job Alerts</Typography>
            <List sx={{ mb: 4 }}>
              {jobAlerts?.active?.map((alert) => (
                <ListItem key={alert.id} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#8B6F47' }}>
                      <NotificationsActive />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{alert.title}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ color: '#8B6F47' }}>
                          {alert.newJobs} new jobs • {alert.frequency} alerts
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8B6F47' }}>
                          Created {formatDate(alert.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip label={`${alert.newJobs} new`} color="success" />
                </ListItem>
              ))}
            </List>

            {/* Recent Matches */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Recent Matches</Typography>
            <List>
              {jobAlerts?.recentMatches?.map((match, index) => (
                <ListItem key={index} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#A67C52' }}>
                      <Target />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{match.jobTitle}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ color: '#8B6F47' }}>
                          {match.company} • {match.location}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8B6F47' }}>
                          {match.salary} • Posted {formatDate(match.postedAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip label={`${match.matchScore}% match`} color="primary" />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Analytics Tab */}
        {tabValue === 4 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              Career Analytics Dashboard
            </Typography>
            
            <Grid container spacing={4}>
              {/* Application Trends */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Application Trends</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#6B5544' }}>
                        {analytics?.applicationTrends?.thisMonth || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>This Month</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47' }}>
                        {analytics?.applicationTrends?.lastMonth || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Last Month</Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={analytics?.applicationTrends?.growth || '+0%'} 
                    color="success" 
                    icon={<ArrowUpward />}
                  />
                </Card>
              </Grid>

              {/* Interview Success */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Interview Success</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#6B5544' }}>
                        {analytics?.interviewConversion?.rate || 0}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Success Rate</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47' }}>
                        {analytics?.interviewConversion?.total || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Total Interviews</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Skills in Demand */}
              <Grid item xs={12}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Skills in Demand</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Skill</TableCell>
                          <TableCell>Demand Score</TableCell>
                          <TableCell>Job Openings</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics?.skillsInDemand?.map((skill, index) => (
                          <TableRow key={index}>
                            <TableCell>{skill.skill}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={skill.demand} 
                                  sx={{ width: 100, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2">{skill.demand}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{skill.jobs}</TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">Learn</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Job Alert Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Job Alert</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alert Title"
            value={newAlert.title}
            onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Frequency</InputLabel>
            <Select
              value={newAlert.frequency}
              onChange={(e) => setNewAlert({ ...newAlert, frequency: e.target.value })}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateJobAlert} variant="contained">Create Alert</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDashboardEnhanced;
