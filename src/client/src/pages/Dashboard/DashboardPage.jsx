import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  useTheme,
  CircularProgress,
  alpha,
  Stack,
} from '@mui/material';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
  Work,
  Description,
  TrendingUp,
  Notifications,
  Add,
  Search,
  People,
  Schedule,
  Assessment,
  Visibility,
  Edit,
  Delete,
  ArrowForward,
  Business,
  School,
  LocationOn,
  Email,
  Phone,
  AutoAwesome,
  Analytics
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { MetricChip, TrendBadge } from '../../components/common';

const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    resumes: 0,
    applications: 0,
    interviews: 0,
    recommendations: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the new comprehensive dashboard endpoint
      const response = await api.get('/profile/dashboard');
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setStats({
          resumes: data.stats?.resumes || 0,
          applications: data.stats?.applications || 0,
          interviews: data.stats?.interviews || 0,
          recommendations: data.stats?.recommendations || 0
        });
        setRecentActivities(data.recent_activities || []);
      } else {
        // Fallback to individual endpoints if dashboard endpoint fails
        const [statsRes, activitiesRes] = await Promise.all([
          api.get('/profile/stats').catch(() => ({ data: { stats: { resumes: 0, applications: 0, interviews: 0, recommendations: 0 } } })),
          api.get('/profile/activities').catch(() => ({ data: { activities: [] } }))
        ]);
        
        const s = statsRes.data?.stats || {};
        setStats({
          resumes: s.resumes || 0,
          applications: s.applications || 0,
          interviews: s.interviews || 0,
          recommendations: s.recommendations || 0
        });
        setRecentActivities(activitiesRes.data?.activities || []);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
      // Set default values on error
      setStats({ resumes: 0, applications: 0, interviews: 0, recommendations: 0 });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const QUICK_ACTIONS = {
    employer: [
      {
        title: 'Post New Job',
        icon: <Add />,
        color: 'primary',
        path: '/employer/jobs/post'
      },
      {
        title: 'Search Candidates',
        icon: <Search />,
        color: 'secondary',
        path: '/employer/candidates/search'
      },
      {
        title: 'Schedule Interview',
        icon: <Schedule />,
        color: 'success',
        path: '/employer/interviews/schedule'
      }
    ],
    jobseeker: [
      {
        title: 'AI Job Recommendations',
        icon: <TrendingUp />,
        color: 'primary',
        path: '/jobs/recommendations'
      },
      {
        title: 'GPT Job Search',
        icon: <Search />,
        color: 'secondary',
        path: '/jobs/search'
      },
      {
        title: 'Resume Analysis',
        icon: <Assessment />,
        color: 'success',
        path: '/resume/analysis'
      },
      {
        title: 'Chat & Network',
        icon: <People />,
        color: 'info',
        path: '/chat'
      }
    ]
  };

  const getQuickActions = () => {
    const actions = user?.role === 'employer' ? QUICK_ACTIONS.employer : QUICK_ACTIONS.jobseeker;
    return actions.map(action => ({
      ...action,
      action: () => navigate(action.path)
    }));
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-fetch data
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'resume_upload':
        return <Description />;
      case 'job_application':
        return <Work />;
      case 'interview_scheduled':
        return <Schedule />;
      default:
        return <Notifications />;
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading your AI-powered dashboard..."
        size={80}
      />
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        className="animate-fade-in"
      >
        <Card sx={{ maxWidth: 500, textAlign: 'center', p: 4 }}>
          <CardContent>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: 'error.main',
                mb: 2,
              }}
            >
              Dashboard Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleRetry}
              sx={{
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                px: 4,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="motion-page-enter">
      {/* Welcome Section */}
      <Box 
        className="dashboard-highlight-panel animate-fade-in"
        sx={{ 
          mb: 5,
          p: 4,
          borderRadius: 3,
          color: 'text.primary',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.9rem', md: '2.35rem' },
            }}
          >
            Welcome back, {user?.firstName}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              maxWidth: 800,
            }}
          >
            Your AI-powered {user?.role === 'employer' ? 'recruitment command center' : 'career acceleration hub'} with 
            advanced machine learning, real-time insights, and intelligent automation.
          </Typography>
          <Box sx={{ mt: 2.5, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            <MetricChip label="AI-backed insights" />
            <MetricChip label="Realtime signals" color="success" />
            <MetricChip label="Role-fit confidence" color="warning" />
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
        What matters now
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={6}>
          <Card 
            className="hover-lift animate-slide-up"
            sx={{ 
              height: '100%',
              background: 'linear-gradient(145deg, #0f5fcc 0%, #1f73f2 75%, #4e8bf0 100%)',
              color: '#ffffff',
              border: '1px solid rgba(210, 230, 255, 0.4)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    width: 56, 
                    height: 56,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Description sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {stats.resumes}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9 }}>
                {user?.role === 'employer' ? 'Active Job Posts' : 'AI-Analyzed Resumes'}
              </Typography>
              <Box sx={{ mt: 1.2 }}><TrendBadge direction="up" label="12% from last month" /></Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card 
            className="hover-lift animate-slide-up"
            sx={{ 
              height: '100%',
              background: 'linear-gradient(160deg, #f8fbff 0%, #edf4ff 100%)',
              color: 'text.primary',
              border: '1px solid #d2dbe5',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(15, 95, 204, 0.12)', 
                    width: 56, 
                    height: 56,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Work sx={{ fontSize: 28, color: '#0f5fcc' }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {stats.applications}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9 }}>
                {user?.role === 'employer' ? 'Applications Received' : 'Applications Sent'}
              </Typography>
              <Box sx={{ mt: 1.2 }}><TrendBadge direction="up" label="8% week" /></Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card 
            className="hover-lift animate-slide-up"
            sx={{ 
              height: '100%',
              background: 'linear-gradient(160deg, #f5fff9 0%, #ebfbf2 100%)',
              color: 'text.primary',
              border: '1px solid #caecd9',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(5, 150, 105, 0.12)', 
                    width: 56, 
                    height: 56,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Schedule sx={{ fontSize: 28, color: '#059669' }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {stats.interviews}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9 }}>
                Upcoming Interviews
              </Typography>
              <Box sx={{ mt: 1.2 }}><TrendBadge direction="flat" label="3 this week" /></Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card 
            className="hover-lift animate-slide-up"
            sx={{ 
              height: '100%',
              background: 'linear-gradient(160deg, #fff8f1 0%, #ffefdd 100%)',
              color: 'text.primary',
              border: '1px solid #ffd5ad',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(245, 122, 46, 0.14)', 
                    width: 56, 
                    height: 56,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <TrendingUp sx={{ fontSize: 28, color: '#a74913' }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {stats.recommendations}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9 }}>
                {user?.role === 'employer' ? 'AI-Matched Candidates' : 'AI Job Matches'}
              </Typography>
              <Box sx={{ mt: 1.2 }}><TrendBadge direction="up" label="95% confidence" /></Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box className="editorial-divider" />
      <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
        What to do next
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card className="hover-lift" sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <AutoAwesome />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  AI-Powered Actions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    className="hover-scale"
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                      px: 3,
                      fontWeight: 600,
                      borderWidth: 2,
                      borderRadius: 2,
                      borderColor: `${action.color}.main`,
                      color: `${action.color}.main`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette[action.color].main, 0.1),
                        borderColor: `${action.color}.dark`,
                        borderWidth: 2,
                      }
                    }}
                  >
                    {action.title === 'AI Job Recommendations' ? 'Generate High-Fit Matches' : action.title}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card className="hover-lift">
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Analytics />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Activities
                  </Typography>
                </Box>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/profile')}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'primary.main',
                  }}
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getStatusColor(activity.status)}.main` }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {activity.title}
                            </Typography>
                            <Chip
                              label={activity.status}
                              size="small"
                              color={getStatusColor(activity.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Profile Summary */}
      <Typography variant="overline" sx={{ color: 'text.secondary', mt: 3, mb: 1, display: 'block' }}>
        Why it changed
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Enhanced Profile Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user?.role === 'employer' ? 'Company' : 'Current Role'}: {user?.role === 'employer' ? 'Tech Corp' : 'Software Engineer'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      Location: {(() => {
                        const loc = user?.location;
                        if (!loc) return 'Not specified';
                        if (typeof loc === 'string') return loc;
                        if (typeof loc === 'object') {
                          const { city, state, country } = loc;
                          const s = [city, state, country].filter(Boolean).join(', ');
                          return s || 'Not specified';
                        }
                        return 'Not specified';
                      })()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      Email: {user?.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      Phone: {user?.phone || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
