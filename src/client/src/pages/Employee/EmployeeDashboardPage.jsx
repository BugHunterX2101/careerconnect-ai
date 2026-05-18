import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Chip, LinearProgress, Paper, Tab, Tabs, Alert,
  IconButton, Tooltip, Divider
} from '@mui/material';
import {
  Work, Assessment, Schedule, TrendingUp, Search,
  Visibility, Chat, VideoCall, Star,
  LocationOn, Business, OpenInNew, Refresh, Launch
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
// Returns true when a job came from LinkedIn/Apify (external live listing)
const isExternalJob = (job) =>
  job?.platform === 'linkedin' ||
  job?.source === 'LinkedIn' ||
  job?.isRealTime === true ||
  Boolean(job?.applyUrl?.includes('linkedin.com'));

const cardSx = {
  background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
  border: '1px solid rgba(139, 111, 71, 0.12)',
  borderRadius: 2,
  transition: 'all 0.25s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 16px rgba(139, 111, 71, 0.12)',
    borderColor: 'rgba(139, 111, 71, 0.25)',
  },
};

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const hasInitialLoadedRef = useRef(false);

  const resolveEntityId = (entity) => entity?._id || entity?.id || null;

  const withTimeout = (promise, ms = 6000) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      setLoadError('');
      if (!silent) setLoading(true);

      const [statsRes, applicationsRes, interviewsRes, recommendationsRes] = await Promise.allSettled([
        withTimeout(employeeService.getDashboardStats()),
        withTimeout(employeeService.getApplications({ limit: 5 })),
        withTimeout(employeeService.getInterviews({ limit: 5, status: 'scheduled' })),
        withTimeout(employeeService.getJobRecommendations({ limit: 5 })),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (applicationsRes.status === 'fulfilled')
        setRecentApplications(applicationsRes.value?.applications || applicationsRes.value?.data?.applications || []);
      if (interviewsRes.status === 'fulfilled')
        setUpcomingInterviews(interviewsRes.value?.interviews || interviewsRes.value?.data?.interviews || []);
      if (recommendationsRes.status === 'fulfilled') {
        const rec = recommendationsRes.value;
        setJobRecommendations(rec?.jobs || rec?.recommendations || rec?.data?.recommendations || []);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard load error:', error);
      setLoadError('Unable to refresh your dashboard right now. Showing the most recent data available.');
    } finally {
      isRefreshingRef.current = false;
      if (!silent) setLoading(false);
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
      'interview:rescheduled',
      'job_recommendations_ready',
      'resume_progress_update'
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

  // Only silent-refresh on reconnect — never on the initial mount where
  // hasInitialLoadedRef is still false (that initial load is handled below).
  useEffect(() => {
    if (isConnected && hasInitialLoadedRef.current) {
      loadDashboardData({ silent: true });
    }
  }, [isConnected, loadDashboardData]);

  useEffect(() => {
    hasInitialLoadedRef.current = true;
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.6rem', md: '2.05rem' }, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '650px' }}>
            Your AI-powered career hub — live LinkedIn job matches, application tracking, and scheduled interviews all in one place.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={isConnected ? 'Live updates active' : 'Reconnecting…'}
              color={isConnected ? 'success' : 'warning'}
              variant="outlined"
            />
            {lastUpdated && (
              <Chip
                size="small"
                label={`Refreshed ${formatDate(lastUpdated)}`}
                variant="outlined"
              />
            )}
            {stats?.totalApplications > 0 && (
              <Chip
                size="small"
                label={`${stats.totalApplications} application${stats.totalApplications !== 1 ? 's' : ''}`}
                color="default"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
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
              Search Jobs
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
              Resume Analysis
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', ...cardSx }} onClick={() => navigate('/employee/applications')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Applications</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalApplications || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.pendingApplications || 0} pending review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', ...cardSx }} onClick={() => navigate('/employee/interviews')}>
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
          <Card sx={cardSx}>
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
          <Card sx={{ cursor: 'pointer', ...cardSx }} onClick={() => navigate('/jobs/recommendations')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Job Matches</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.25rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.jobMatches || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                {stats?.newMatches || 0} new this week
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
                  {recentApplications.map((application, index) => (
                    <ListItem key={resolveEntityId(application) || `${application?.job?.id || 'job'}-${application?.appliedAt || index}`} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544' }}>
                Recommended Jobs
              </Typography>
              <Chip
                size="small"
                label="Live LinkedIn data"
                icon={<Launch sx={{ fontSize: '14px !important' }} />}
                sx={{ bgcolor: '#0077b5', color: '#fff', fontWeight: 600, fontSize: '0.78rem' }}
              />
            </Box>

            {jobRecommendations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#6B5544', mb: 1 }}>No recommendations yet</Typography>
                <Typography variant="body1" sx={{ color: '#8B6F47', mb: 3 }}>
                  Add skills to your profile to get personalised LinkedIn job matches.
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/profile')}
                  sx={{ borderColor: '#8B6F47', color: '#8B6F47', textTransform: 'none', fontWeight: 600 }}>
                  Update Profile
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {jobRecommendations.map((job, index) => {
                  const jobId = resolveEntityId(job);
                  const external = isExternalJob(job);
                  const score = typeof job.matchScore === 'number' ? job.matchScore : null;

                  return (
                    <ListItem
                      key={jobId || `${job?.title || 'job'}-${index}`}
                      sx={{
                        border: '1px solid rgba(139, 111, 71, 0.2)',
                        borderRadius: 2,
                        mb: 2,
                        p: 2.5,
                        background: 'linear-gradient(135deg, rgba(250,243,224,0.6) 0%, rgba(245,230,211,0.4) 100%)',
                        transition: 'all 0.25s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 14px rgba(139,111,71,0.15)' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: external ? '#0077b5' : '#8B6F47', width: 48, height: 48 }}>
                          {external ? (
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>in</Typography>
                          ) : (
                            <Business sx={{ fontSize: 26 }} />
                          )}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#6B5544' }}>
                              {job.title}
                            </Typography>
                            {external && (
                              <Chip label="LinkedIn" size="small"
                                sx={{ bgcolor: '#0077b5', color: '#fff', fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                            )}
                            {score !== null && (
                              <Chip
                                label={`${score}% match`}
                                size="small"
                                sx={{ bgcolor: score >= 60 ? '#A67C52' : 'rgba(139,111,71,0.25)', color: score >= 60 ? '#FAF3E0' : '#6B5544', fontWeight: 700, fontSize: '0.75rem', height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#8B6F47', mt: 0.5 }}>
                              {job.company || 'Company not listed'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationOn sx={{ fontSize: 14, color: '#A67C52' }} />
                              <Typography variant="body2" sx={{ color: '#8B6F47' }}>
                                {job.location || 'Location not specified'}
                                {job.employmentType && ` · ${job.employmentType}`}
                              </Typography>
                            </Box>
                            {job.salary && (
                              <Typography variant="body2" sx={{ color: '#6B5544', mt: 0.5, fontWeight: 600 }}>
                                {typeof job.salary === 'string' ? job.salary : JSON.stringify(job.salary)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 1 }}>
                        {external ? (
                          <Tooltip title="View & Apply on LinkedIn">
                            <Button
                              size="small"
                              variant="contained"
                              endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                              onClick={() => job.applyUrl && window.open(job.applyUrl, '_blank', 'noopener,noreferrer')}
                              disabled={!job.applyUrl}
                              sx={{
                                bgcolor: '#0077b5', color: '#fff', textTransform: 'none',
                                fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#005885' }
                              }}
                            >
                              Apply
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="View Job Details">
                            <IconButton
                              size="small"
                              onClick={() => jobId && navigate(`/jobs/${jobId}`)}
                              sx={{ color: '#8B6F47' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Button
              fullWidth variant="outlined"
              onClick={() => navigate('/jobs/recommendations')}
              sx={{
                borderColor: '#8B6F47', color: '#8B6F47', borderWidth: 2,
                py: 2, fontSize: '1rem', fontWeight: 600, mt: 3, textTransform: 'none',
                '&:hover': { borderWidth: 2, borderColor: '#6B5544', background: 'rgba(139,111,71,0.08)' }
              }}
            >
              View All Live Job Matches
            </Button>
          </Box>
        )}

        {/* Upcoming Interviews Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#6B5544', mb: 3 }}>Upcoming Interviews</Typography>
            <List>
              {upcomingInterviews.map((interview, index) => (
                <ListItem key={resolveEntityId(interview) || `${interview?.scheduledAt || 'interview'}-${index}`} sx={{ mb: 2, p: 2, borderRadius: 2, '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
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
                      <IconButton
                        onClick={() => {
                          const interviewerId = interview?.interviewer?._id || interview?.interviewer?.id;
                          if (interviewerId) {
                            navigate(`/chat?user=${interviewerId}`);
                          }
                        }}
                        sx={{ color: '#8B6F47' }}
                      >
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
