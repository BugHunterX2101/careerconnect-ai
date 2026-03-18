import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, Card, CardContent, Grid, Button, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Chip, IconButton, Menu, MenuItem, Divider, Alert,
  LinearProgress, Paper, Tab, Tabs
} from '@mui/material';
import { 
  Business, People, Work, Assessment, Add, Search, 
  Schedule, Chat, MoreVert, Notifications, TrendingUp,
  VideoCall, Email, Phone, LocationOn, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employerService } from '../../services/employerService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const EmployerDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      setLoadError('');
      if (!silent) {
        setLoading(true);
      }

      const [statsData, jobsData, interviewsData] = await Promise.all([
        employerService.getDashboardStats(),
        employerService.getJobs({ limit: 5 }),
        employerService.getInterviews({ limit: 5, status: 'scheduled' })
      ]);
      
      setStats(statsData);
      setRecentJobs(jobsData.jobs || []);
      setUpcomingInterviews(interviewsData.interviews || []);
      
      // Get recent applications from jobs
      if (jobsData.jobs?.length > 0) {
        const jobPromises = jobsData.jobs.slice(0, 3).map(job => 
          employerService.getJobApplicants(job._id, { limit: 3 })
            .then(appData => (appData.applications || []).map(app => ({ ...app, jobTitle: job.title })))
            .catch(error => {
              console.error('Error loading applications:', error);
              return [];
            })
        );
        
        const applicationsArrays = await Promise.all(jobPromises);
        const applications = applicationsArrays.flat().slice(0, 5);
        setRecentApplications(applications);
      } else {
        setRecentApplications([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoadError('Unable to refresh dashboard data right now. Showing the most recent data available.');
    } finally {
      isRefreshingRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadDashboardData({ silent: true });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboardData]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const refreshFromRealtimeEvent = () => loadDashboardData({ silent: true });
    const realtimeEvents = [
      'interview:scheduled',
      'interview:cancelled',
      'interview:completed',
      'job_recommendations_ready',
      'resume_progress_update',
      'chat:new_message'
    ];

    realtimeEvents.forEach((eventName) => {
      socket.on(eventName, refreshFromRealtimeEvent);
    });

    return () => {
      realtimeEvents.forEach((eventName) => {
        socket.off(eventName, refreshFromRealtimeEvent);
      });
    };
  }, [socket, loadDashboardData]);

  useEffect(() => {
    if (isConnected) {
      loadDashboardData({ silent: true });
    }
  }, [isConnected, loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await loadDashboardData({ silent: true });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'post-job':
        navigate('/employer/jobs/post');
        break;
      case 'search-candidates':
        navigate('/employer/candidates/search');
        break;
      case 'schedule-interview':
        navigate('/employer/interviews/schedule');
        break;
      case 'view-applications':
        navigate('/employer/applications');
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>{t('dashboard.loading', 'Loading Dashboard...')}</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, fontSize: '2rem', color: '#6B5544', letterSpacing: '-0.5px' }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1rem', lineHeight: 1.6 }}>
            Manage your recruitment and hiring process
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={isConnected ? 'Real-time connected' : 'Reconnecting live updates'}
              color={isConnected ? 'success' : 'warning'}
              variant="outlined"
            />
            <Chip
              size="small"
              label={lastUpdated ? `Updated ${formatDate(lastUpdated)}` : 'Waiting for first sync'}
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            startIcon={<Refresh />}
            sx={{
              borderColor: '#8B6F47',
              color: '#8B6F47',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#6B5544',
                background: 'rgba(139, 111, 71, 0.08)'
              }
            }}
          >
            {isManualRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: 22 }} />}
            onClick={() => handleQuickAction('post-job')}
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
              color: '#FAF3E0',
              py: 1.75,
              px: 3.5,
              fontSize: '0.95rem',
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
            Post New Job
          </Button>
        </Box>
      </Box>

      {loadError && (
        <Alert severity="warning" sx={{ mb: 3, borderLeft: '4px solid #A67C52' }}>
          {loadError}
        </Alert>
      )}

      {/* Quick Actions */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 2.5 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Work sx={{ fontSize: 24 }} />}
              onClick={() => handleQuickAction('post-job')}
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
              Post Job
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Search sx={{ fontSize: 24 }} />}
              onClick={() => handleQuickAction('search-candidates')}
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
              Find Candidates
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule sx={{ fontSize: 24 }} />}
              onClick={() => handleQuickAction('schedule-interview')}
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
              Schedule Interview
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<People sx={{ fontSize: 24 }} />}
              onClick={() => handleQuickAction('view-applications')}
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
              View Applications
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Stats Cards */}
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
          }} onClick={() => navigate('/employer/jobs')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Active Jobs</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.activeJobs || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.totalJobs || 0} total jobs posted
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
          }} onClick={() => navigate('/employer/applications')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1.5, color: '#6B5544', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Applications</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalApplications || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.newApplications || 0} new this week
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
          }} onClick={() => navigate('/employer/interviews')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1.5, color: '#A67C52', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Interviews</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.scheduledInterviews || 0}
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
                <Business sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Hired</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalHired || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.hiredThisMonth || 0} this month
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
          aria-label="dashboard tabs"
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
          <Tab label={t('dashboard.tab.recentActivity', 'Recent Activity')} aria-label="recent activity tab" />
          <Tab label={t('dashboard.tab.upcomingInterviews', 'Upcoming Interviews')} aria-label="upcoming interviews tab" />
          <Tab label={t('dashboard.tab.jobPerformance', 'Role Funnel Performance')} aria-label="job performance tab" />
        </Tabs>
        
        {/* Recent Activity Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Recent Jobs */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
                  <Work sx={{ mr: 2, fontSize: 28 }} />
                  Recent Job Posts
                </Typography>
                <List>
                  {recentJobs.map((job) => (
                    <ListItem 
                      key={job._id} 
                      sx={{ 
                        cursor: 'pointer',
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        '&:hover': { background: 'rgba(139, 111, 71, 0.05)' }
                      }}
                      onClick={() => navigate(`/employer/jobs/${job._id}/applicants`)}
                    >
                      <ListItemText
                        primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6B5544' }}>{job.title}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem', mt: 0.5 }}>
                              {job.location} • {job.type}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Chip 
                                size="medium" 
                                label={`${job.applications?.length || 0} applications`}
                                sx={{ fontSize: '1rem', fontWeight: 600, bgcolor: 'rgba(139, 111, 71, 0.15)', color: '#6B5544' }}
                              />
                              <Chip 
                                size="medium" 
                                label={job.status} 
                                sx={{ 
                                  fontSize: '1rem', 
                                  fontWeight: 600,
                                  bgcolor: job.status === 'active' ? '#A67C52' : 'rgba(139, 111, 71, 0.15)',
                                  color: job.status === 'active' ? '#FAF3E0' : '#6B5544'
                                }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {recentJobs.length === 0 && (
                    <ListItem sx={{ p: 3 }}>
                      <ListItemText 
                        primary={<Typography variant="h6" sx={{ color: '#6B5544', fontSize: '1rem' }}>No jobs posted yet</Typography>}
                        secondary={<Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>Start by posting your first job</Typography>}
                      />
                    </ListItem>
                  )}
                </List>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate('/employer/jobs')}
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
                  View All Jobs
                </Button>
              </Grid>

              {/* Recent Applications */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
                  <People sx={{ mr: 2, fontSize: 28 }} />
                  Recent Applications
                </Typography>
                <List>
                  {recentApplications.map((application) => (
                    <ListItem key={application._id} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
                      <ListItemAvatar>
                        <Avatar src={application.applicant?.profile?.avatar} sx={{ bgcolor: '#8B6F47', width: 48, height: 48 }}>
                          {application.applicant?.firstName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6B5544' }}>{`${application.applicant?.firstName} ${application.applicant?.lastName}`}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47', mt: 0.5 }}>{application.jobTitle}</Typography>
                            <Typography variant="body2" sx={{ fontSize: '1rem', color: '#8B6F47', mt: 1 }}>
                              Applied {formatDate(application.appliedAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        size="medium" 
                        label={application.status} 
                        sx={{ 
                          fontSize: '1rem', 
                          fontWeight: 600,
                          bgcolor: application.status === 'pending' ? '#D4BA94' : 'rgba(139, 111, 71, 0.15)',
                          color: application.status === 'pending' ? '#FAF3E0' : '#6B5544'
                        }}
                      />
                    </ListItem>
                  ))}
                  {recentApplications.length === 0 && (
                    <ListItem sx={{ p: 3 }}>
                      <ListItemText 
                        primary={<Typography variant="h6" sx={{ color: '#6B5544', fontSize: '1rem' }}>No applications yet</Typography>}
                        secondary={<Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>Applications will appear here</Typography>}
                      />
                    </ListItem>
                  )}
                </List>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate('/employer/applications')}
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
            </Grid>
          </Box>
        )}

        {/* Upcoming Interviews Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              <Schedule sx={{ mr: 2, fontSize: 28 }} />
              Upcoming Interviews
            </Typography>
            <List>
              {upcomingInterviews.map((interview) => (
                <ListItem key={interview._id} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
                  <ListItemAvatar>
                    <Avatar src={interview.candidate?.profile?.avatar} sx={{ bgcolor: '#6B5544', width: 48, height: 48 }}>
                      {interview.candidate?.firstName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6B5544' }}>{`${interview.candidate?.firstName} ${interview.candidate?.lastName}`}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47', mt: 0.5 }}>{interview.job?.title}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '1rem', color: '#8B6F47', mt: 1 }}>
                          {formatDate(interview.scheduledAt)} • {interview.duration} min
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {interview.type === 'video' && (
                      <IconButton 
                        size="medium" 
                        onClick={() => window.open(interview.meetLink, '_blank')}
                        disabled={!interview.meetLink}
                        sx={{ color: '#8B6F47' }}
                      >
                        <VideoCall sx={{ fontSize: 28 }} />
                      </IconButton>
                    )}
                    <IconButton 
                      size="medium" 
                      onClick={() => navigate(`/chat?user=${interview.candidate._id}`)}
                      sx={{ color: '#8B6F47' }}
                    >
                      <Chat sx={{ fontSize: 28 }} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
              {upcomingInterviews.length === 0 && (
                <ListItem sx={{ p: 3 }}>
                  <ListItemText 
                    primary={<Typography variant="h6" sx={{ color: '#6B5544', fontSize: '1rem' }}>No upcoming interviews</Typography>}
                    secondary={<Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>Schedule interviews with candidates</Typography>}
                  />
                </ListItem>
              )}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/employer/interviews')}
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

        {/* Job Performance Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>
              <TrendingUp sx={{ mr: 2, fontSize: 28 }} />
              Role Funnel Metrics
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{
                  background: 'linear-gradient(135deg, rgba(250, 243, 224, 0.7) 0%, rgba(245, 230, 211, 0.7) 100%)',
                  border: '2px solid rgba(139, 111, 71, 0.3)',
                  borderRadius: 3,
                  p: 2
                }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ color: '#8B6F47', fontWeight: 700, fontSize: '1.2rem', mb: 2 }}>
                      {t('dashboard.metrics.applicationRate', 'Application Rate')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#6B5544', fontSize: '2.25rem', mb: 1 }}>{stats?.avgApplicationsPerJob || 0}</Typography>
                    <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>
                      {t('dashboard.metrics.averagePerJob', 'Average per job')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{
                  background: 'linear-gradient(135deg, rgba(250, 243, 224, 0.7) 0%, rgba(245, 230, 211, 0.7) 100%)',
                  border: '2px solid rgba(139, 111, 71, 0.3)',
                  borderRadius: 3,
                  p: 2
                }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ color: '#6B5544', fontWeight: 700, fontSize: '1.2rem', mb: 2 }}>
                      {t('dashboard.metrics.responseRate', 'Response Rate')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#6B5544', fontSize: '2.25rem', mb: 1 }}>{stats?.responseRate || 0}%</Typography>
                    <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>
                      {t('dashboard.metrics.candidateResponses', 'Candidate responses')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{
                  background: 'linear-gradient(135deg, rgba(250, 243, 224, 0.7) 0%, rgba(245, 230, 211, 0.7) 100%)',
                  border: '2px solid rgba(139, 111, 71, 0.3)',
                  borderRadius: 3,
                  p: 2
                }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ color: '#A67C52', fontWeight: 700, fontSize: '1.2rem', mb: 2 }}>
                      {t('dashboard.metrics.hireRate', 'Hire Rate')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#6B5544', fontSize: '2.25rem', mb: 1 }}>{stats?.hireRate || 0}%</Typography>
                    <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.125rem' }}>
                      {t('dashboard.metrics.successfulHires', 'Successful hires')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Notifications */}
      {stats?.notifications?.length > 0 && (
        <Alert severity="info" sx={{ mb: 3, fontSize: '1.125rem', borderLeft: '4px solid #8B6F47', bgcolor: 'rgba(250, 243, 224, 0.5)' }}>
          <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#6B5544' }}>
            You have {stats.notifications.length} new notification(s)
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default EmployerDashboardPage;

