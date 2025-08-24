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
  useTheme
} from '@mui/material';
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
  Phone
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        resumes: 3,
        applications: 12,
        interviews: 2,
        recommendations: 8
      });
      setRecentActivities([
        {
          id: 1,
          type: 'resume_upload',
          title: 'Resume uploaded successfully',
          description: 'Software Engineer resume processed with AI analysis',
          timestamp: '2 hours ago',
          status: 'completed'
        },
        {
          id: 2,
          type: 'job_application',
          title: 'Application submitted',
          description: 'Applied for Senior Developer at Tech Corp',
          timestamp: '1 day ago',
          status: 'pending'
        },
        {
          id: 3,
          type: 'interview_scheduled',
          title: 'Interview scheduled',
          description: 'Video interview with HR Manager tomorrow',
          timestamp: '2 days ago',
          status: 'scheduled'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getQuickActions = () => {
    if (user?.role === 'employer') {
      return [
        {
          title: 'Post New Job',
          icon: <Add />,
          color: 'primary',
          action: () => navigate('/employer/jobs/post')
        },
        {
          title: 'Search Candidates',
          icon: <Search />,
          color: 'secondary',
          action: () => navigate('/employer/candidates')
        },
        {
          title: 'Schedule Interview',
          icon: <Schedule />,
          color: 'success',
          action: () => navigate('/employer/interviews/schedule')
        },
        {
          title: 'View Analytics',
          icon: <Assessment />,
          color: 'info',
          action: () => navigate('/employer/dashboard')
        }
      ];
    }

    return [
      {
        title: 'Upload Resume',
        icon: <Description />,
        color: 'primary',
        action: () => navigate('/resume/upload')
      },
      {
        title: 'Job Recommendations',
        icon: <TrendingUp />,
        color: 'secondary',
        action: () => navigate('/jobs/recommendations')
      },
      {
        title: 'Search Jobs',
        icon: <Search />,
        color: 'success',
        action: () => navigate('/jobs/search')
      },
      {
        title: 'View Profile',
        icon: <Business />,
        color: 'info',
        action: () => navigate('/profile')
      }
    ];
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
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your {user?.role === 'employer' ? 'recruitment' : 'career'} today.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Description />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.resumes}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'employer' ? 'Active Job Posts' : 'Resumes'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.applications}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'employer' ? 'Applications Received' : 'Applications Sent'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.interviews}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upcoming Interviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.recommendations}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'employer' ? 'Candidates Matched' : 'Job Recommendations'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderColor: `${action.color}.main`,
                      color: `${action.color}.main`,
                      '&:hover': {
                        backgroundColor: `${action.color}.light`,
                        borderColor: `${action.color}.dark`
                      }
                    }}
                  >
                    {action.title}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Activities
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/profile')}
                  sx={{ textTransform: 'none' }}
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
                              {activity.timestamp}
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
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Profile Summary
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
                      Location: {user?.location || 'Not specified'}
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
