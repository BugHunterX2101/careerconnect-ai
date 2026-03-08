import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Tabs, Tab,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip,
  IconButton, Menu, MenuItem, Divider, Alert, LinearProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Badge,
  Tooltip, Switch, FormControlLabel, Accordion, AccordionSummary,
  AccordionDetails, Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import { 
  Business, People, Work, Assessment, Add, Search, Schedule, Chat,
  MoreVert, Notifications, TrendingUp, VideoCall, Email, Phone,
  LocationOn, Analytics, Timeline, Speed, EmojiEvents, PersonSearch,
  AutoAwesome, Lightbulb, Target, NotificationsActive, Settings,
  Download, Share, FilterList, Sort, ExpandMore, CheckCircle,
  Cancel, Pending, Group, Star, ThumbUp, ThumbDown, Visibility,
  Edit, Delete, Send, CalendarToday, AttachMoney, TrendingDown,
  ArrowUpward, ArrowDownward, PieChart, BarChart, ShowChart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employerService } from '../../services/employerService';
import { useAuth } from '../../contexts/AuthContext';

const EmployerDashboardEnhanced = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // State management
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [team, setTeam] = useState(null);
  const [hiringReport, setHiringReport] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: '', role: 'Recruiter' });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsData, analyticsData, pipelineData, teamData, reportData,
        notificationsData, jobsData, interviewsData
      ] = await Promise.all([
        employerService.getDashboardStats(),
        employerService.getAnalytics(),
        employerService.getPipeline(),
        employerService.getTeamMembers(),
        employerService.getHiringReport(),
        employerService.getNotifications(),
        employerService.getJobs({ limit: 5 }),
        employerService.getInterviews({ limit: 5, status: 'scheduled' })
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setPipeline(pipelineData);
      setTeam(teamData);
      setHiringReport(reportData);
      setNotifications(notificationsData.notifications || []);
      setRecentJobs(jobsData.jobs || []);
      setUpcomingInterviews(interviewsData.interviews || []);
      
      // Get recent applications from jobs
      if (jobsData.jobs?.length > 0) {
        const jobPromises = jobsData.jobs.slice(0, 3).map(job => 
          employerService.getJobApplicants(job._id, { limit: 3 })
            .then(appData => (appData.applications || []).map(app => ({ ...app, jobTitle: job.title })))
            .catch(() => [])
        );
        
        const applicationsArrays = await Promise.all(jobPromises);
        const applications = applicationsArrays.flat().slice(0, 5);
        setRecentApplications(applications);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeamMember = async () => {
    try {
      await employerService.inviteTeamMember(newInvite);
      setInviteDialogOpen(false);
      setNewInvite({ email: '', role: 'Recruiter' });
      loadDashboardData();
    } catch (error) {
      console.error('Error inviting team member:', error);
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
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, fontSize: '2.75rem', color: '#6B5544', letterSpacing: '-0.5px' }}>
            Welcome back, {user?.firstName}! 🎯
          </Typography>
          <Typography variant="body1" sx={{ color: '#8B6F47', fontSize: '1.25rem', lineHeight: 1.6, maxWidth: '650px' }}>
            Your comprehensive hiring command center with AI-powered candidate matching, advanced analytics, and team collaboration tools
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
            startIcon={<Add sx={{ fontSize: 28 }} />}
            onClick={() => navigate('/employer/jobs/post')}
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
            Post New Job
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
          }} onClick={() => navigate('/employer/jobs')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Active Jobs</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '3rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.activeJobs || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.totalJobs || 0} total posted
                </Typography>
                {analytics?.trends?.applications?.growth && (
                  <Chip 
                    size="small" 
                    label={analytics.trends.applications.growth} 
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
          }} onClick={() => navigate('/employer/applications')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1.5, color: '#6B5544', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Applications</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '3rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalApplications || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.newApplications || 0} new this week
                </Typography>
                <Chip 
                  size="small" 
                  label={`${stats?.responseRate || 0}% response`} 
                  color="info"
                />
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
          }} onClick={() => navigate('/employer/interviews')}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1.5, color: '#A67C52', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Interviews</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '3rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.scheduledInterviews || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.upcomingInterviews || 0} upcoming
                </Typography>
                <Chip 
                  size="small" 
                  label={`${analytics?.trends?.timeToHire?.average || 0} days avg`} 
                  color="secondary"
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
                <EmojiEvents sx={{ mr: 1.5, color: '#8B6F47', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#6B5544' }}>Hired</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '3rem', mb: 1, letterSpacing: '-1px' }}>
                {stats?.totalHired || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8B6F47', fontSize: '1rem' }}>
                  {stats?.hiredThisMonth || 0} this month
                </Typography>
                <Chip 
                  size="small" 
                  label={`${stats?.hireRate || 0}% success`} 
                  color="success"
                />
              </Box>
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
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 2.5 }}>
          🚀 Smart Hiring Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Work sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/employer/jobs/post')}
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonSearch sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/employer/candidates/search')}
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
              Find Talent
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule sx={{ fontSize: 24 }} />}
              onClick={() => navigate('/employer/interviews/schedule')}
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Group sx={{ fontSize: 24 }} />}
              onClick={() => setInviteDialogOpen(true)}
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
              Invite Team
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
          <Tab label="Hiring Pipeline" />
          <Tab label="Team Management" />
          <Tab label="Reports & Insights" />
          <Tab label="Advanced Analytics" />
        </Tabs>
        
        {/* Dashboard Overview Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Recent Jobs */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
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
                        border: '1px solid rgba(139, 111, 71, 0.2)',
                        '&:hover': { background: 'rgba(139, 111, 71, 0.05)' }
                      }}
                      onClick={() => navigate(`/employer/jobs/${job._id}/applicants`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#8B6F47', width: 48, height: 48 }}>
                          <Business />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#6B5544' }}>{job.title}</Typography>}
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
                      <IconButton onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
                        <MoreVert />
                      </IconButton>
                    </ListItem>
                  ))}
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
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
                  <People sx={{ mr: 2, fontSize: 28 }} />
                  Recent Applications
                </Typography>
                <List>
                  {recentApplications.map((application) => (
                    <ListItem key={application._id} sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid rgba(139, 111, 71, 0.2)', '&:hover': { background: 'rgba(139, 111, 71, 0.05)' } }}>
                      <ListItemAvatar>
                        <Avatar src={application.applicant?.profile?.avatar} sx={{ bgcolor: '#8B6F47', width: 48, height: 48 }}>
                          {application.applicant?.firstName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#6B5544' }}>{`${application.applicant?.firstName} ${application.applicant?.lastName}`}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body1" sx={{ fontSize: '1.125rem', color: '#8B6F47', mt: 0.5 }}>{application.jobTitle}</Typography>
                            <Typography variant="body2" sx={{ fontSize: '1rem', color: '#8B6F47', mt: 1 }}>
                              Applied {formatDate(application.appliedAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <Chip 
                          size="medium" 
                          label={application.status} 
                          color={getStatusColor(application.status)}
                          sx={{ fontSize: '1rem', fontWeight: 600 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" sx={{ color: '#8B6F47' }}>
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#6B5544' }}>
                            <Chat />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
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

        {/* Hiring Pipeline Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
              Hiring Pipeline Overview
            </Typography>
            
            {/* Pipeline Stages */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {pipeline?.stages?.map((stage, index) => (
                <Grid item xs={12} sm={6} md={2} key={index}>
                  <Card sx={{ p: 2, textAlign: 'center', border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 1 }}>{stage.stage}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47', mb: 1 }}>{stage.count}</Typography>
                    <Typography variant="body2" sx={{ color: '#8B6F47' }}>{stage.percentage}%</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stage.percentage} 
                      sx={{ 
                        mt: 1, 
                        height: 6, 
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: index < 3 ? '#8B6F47' : '#A67C52'
                        }
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Recent Pipeline Activity */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Recent Activity</Typography>
            <List>
              {pipeline?.recentActivity?.map((activity, index) => (
                <ListItem key={index} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#A67C52' }}>
                      <Timeline />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{activity.candidate}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ color: '#8B6F47' }}>{activity.job} • {activity.action}</Typography>
                        <Typography variant="body2" sx={{ color: '#8B6F47' }}>{formatDate(activity.timestamp)}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Bottlenecks */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Pipeline Bottlenecks</Typography>
            <Grid container spacing={2}>
              {pipeline?.bottlenecks?.map((bottleneck, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Alert severity="warning" sx={{ fontSize: '1.125rem' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{bottleneck.stage}</Typography>
                    <Typography variant="body2">Average delay: {bottleneck.avgDelay}</Typography>
                    <Typography variant="body2">Suggestion: {bottleneck.suggestion}</Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Team Management Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
              Team Management
            </Typography>
            
            {/* Team Members */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Team Members</Typography>
            <List sx={{ mb: 4 }}>
              {team?.members?.map((member) => (
                <ListItem key={member.id} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#8B6F47', width: 48, height: 48 }}>
                      {member.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{member.name}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ color: '#8B6F47' }}>{member.email}</Typography>
                        <Typography variant="body2" sx={{ color: '#8B6F47' }}>
                          {member.role} • Joined {formatDate(member.joinedAt)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {member.permissions.map((permission, index) => (
                            <Chip key={index} label={permission} size="small" sx={{ mr: 1, mb: 1 }} />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" sx={{ color: '#8B6F47' }}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#A67C52' }}>
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>

            {/* Pending Invites */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Pending Invites</Typography>
            <List sx={{ mb: 4 }}>
              {team?.pendingInvites?.map((invite, index) => (
                <ListItem key={index} sx={{ border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#D4BA94' }}>
                      <Send />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544' }}>{invite.email}</Typography>}
                    secondary={
                      <Typography variant="body1" sx={{ color: '#8B6F47' }}>
                        {invite.role} • Invited {formatDate(invite.invitedAt)}
                      </Typography>
                    }
                  />
                  <Chip label="Pending" color="warning" />
                </ListItem>
              ))}
            </List>

            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setInviteDialogOpen(true)}
              sx={{ 
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                color: '#FAF3E0'
              }}
            >
              Invite Team Member
            </Button>
          </Box>
        )}

        {/* Reports & Insights Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
              Reports & Insights
            </Typography>
            
            {/* Hiring Summary */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Hiring Summary</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47', mb: 1 }}>
                    {hiringReport?.summary?.totalHires || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8B6F47' }}>Total Hires</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B5544' }}>
                    Avg Time to Hire: {hiringReport?.summary?.averageTimeToHire || 0} days
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#6B5544' }}>
                    Cost per Hire: ${hiringReport?.summary?.costPerHire || 0}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Offer Acceptance</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47', mb: 1 }}>
                    {hiringReport?.summary?.offerAcceptanceRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8B6F47' }}>Acceptance Rate</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={hiringReport?.summary?.offerAcceptanceRate || 0} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#A67C52'
                      }
                    }}
                  />
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Top Source</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47', mb: 1 }}>
                    {hiringReport?.topSources?.[0]?.source || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8B6F47' }}>
                    {hiringReport?.topSources?.[0]?.hires || 0} hires
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#6B5544', mt: 1 }}>
                    Cost: {hiringReport?.topSources?.[0]?.cost || '$0'}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Department Breakdown */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Hiring by Department</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell>Hires</TableCell>
                    <TableCell>Avg Salary</TableCell>
                    <TableCell>Time to Hire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hiringReport?.byDepartment?.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell>{dept.department}</TableCell>
                      <TableCell>{dept.hires}</TableCell>
                      <TableCell>{dept.avgSalary}</TableCell>
                      <TableCell>{dept.timeToHire} days</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button 
              variant="outlined" 
              startIcon={<Download />}
              sx={{ mr: 2 }}
            >
              Export Report
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Share />}
            >
              Share Report
            </Button>
          </Box>
        )}

        {/* Advanced Analytics Tab */}
        {tabValue === 4 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#6B5544', mb: 3 }}>
              Advanced Analytics
            </Typography>
            
            <Grid container spacing={4}>
              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Performance Metrics</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#6B5544' }}>
                        {analytics?.overview?.totalApplications || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Total Applications</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47' }}>
                        {analytics?.overview?.totalHires || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Total Hires</Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={`${((analytics?.overview?.totalHires || 0) / (analytics?.overview?.totalApplications || 1) * 100).toFixed(1)}% conversion`} 
                    color="success" 
                    icon={<TrendingUp />}
                  />
                </Card>
              </Grid>

              {/* Candidate Quality */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Candidate Quality</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#6B5544' }}>
                        {analytics?.candidateQuality?.averageScore || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Average Score</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B6F47' }}>
                        {analytics?.candidateQuality?.qualifiedCandidates || 0}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B6F47' }}>Qualified</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6B5544', mb: 1 }}>Top Skills:</Typography>
                    {analytics?.candidateQuality?.topSkills?.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                </Card>
              </Grid>

              {/* Top Performing Jobs */}
              <Grid item xs={12}>
                <Card sx={{ p: 3, border: '1px solid rgba(139, 111, 71, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B5544', mb: 2 }}>Top Performing Jobs</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Title</TableCell>
                          <TableCell>Applications</TableCell>
                          <TableCell>Interviews</TableCell>
                          <TableCell>Hires</TableCell>
                          <TableCell>Conversion Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics?.topPerformingJobs?.map((job, index) => (
                          <TableRow key={index}>
                            <TableCell>{job.title}</TableCell>
                            <TableCell>{job.applications}</TableCell>
                            <TableCell>{job.interviews}</TableCell>
                            <TableCell>{job.hires}</TableCell>
                            <TableCell>
                              <Chip 
                                label={job.conversionRate} 
                                color={parseFloat(job.conversionRate) > 3 ? 'success' : 'warning'}
                                size="small"
                              />
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

      {/* Team Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={newInvite.email}
            onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newInvite.role}
              onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
            >
              <MenuItem value="Recruiter">Recruiter</MenuItem>
              <MenuItem value="Hiring Manager">Hiring Manager</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInviteTeamMember} variant="contained">Send Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Edit sx={{ mr: 1 }} /> Edit Job
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Visibility sx={{ mr: 1 }} /> View Applications
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Analytics sx={{ mr: 1 }} /> View Analytics
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Delete sx={{ mr: 1 }} /> Delete Job
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EmployerDashboardEnhanced;