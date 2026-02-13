import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Badge,
  Fab
} from '@mui/material';
import {
  Event,
  VideoCall,
  LocationOn,
  AccessTime,
  Person,
  Phone,
  Email,
  Chat,
  Refresh,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const InterviewsPageEnhanced = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchInterviews();
    setupSocketListeners();
  }, []);

  useEffect(() => {
    if (socket && connected && user) {
      socket.emit('join_user_room', user.id);
    }
  }, [socket, connected, user]);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Fallback to mock data if no token
        const mockInterviews = [
          {
            id: 1,
            _id: '1',
            job: { title: 'Frontend Developer', company: 'Tech Corp' },
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            type: 'video',
            status: 'scheduled',
            interviewer: { firstName: 'John', lastName: 'Smith', email: 'john@techcorp.com' },
            candidate: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
            meetLink: 'https://meet.google.com/abc-def-ghi',
            notes: 'Technical interview focusing on React and JavaScript'
          },
          {
            id: 2,
            _id: '2',
            job: { title: 'React Developer', company: 'StartupXYZ' },
            scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            type: 'video',
            status: 'scheduled',
            interviewer: { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@startupxyz.com' },
            candidate: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
            notes: 'First round interview with HR and technical lead'
          },
          {
            id: 3,
            _id: '3',
            job: { title: 'Full Stack Engineer', company: 'BigTech Inc' },
            scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            duration: 90,
            type: 'video',
            status: 'completed',
            interviewer: { firstName: 'Mike', lastName: 'Davis', email: 'mike@bigtech.com' },
            candidate: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
            notes: 'Final round interview with engineering manager',
            feedback: 'Great technical skills, good communication',
            rating: 4
          }
        ];
        setInterviews(mockInterviews);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/video/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews || []);
      } else {
        setError('Failed to fetch interviews');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('interview:scheduled', handleInterviewScheduled);
    socket.on('interview:updated', handleInterviewUpdated);
    socket.on('interview:cancelled', handleInterviewCancelled);
    socket.on('interview:reminder', handleInterviewReminder);

    return () => {
      socket.off('interview:scheduled');
      socket.off('interview:updated');
      socket.off('interview:cancelled');
      socket.off('interview:reminder');
    };
  };

  const handleInterviewScheduled = (data) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'scheduled',
      message: `New interview scheduled for ${data.job}`,
      timestamp: new Date().toISOString()
    }]);
    setUnreadNotifications(prev => prev + 1);
    fetchInterviews();
  };

  const handleInterviewUpdated = (data) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'updated',
      message: `Interview updated: ${data.message}`,
      timestamp: new Date().toISOString()
    }]);
    setUnreadNotifications(prev => prev + 1);
    fetchInterviews();
  };

  const handleInterviewCancelled = (data) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'cancelled',
      message: `Interview cancelled for ${data.job}`,
      timestamp: new Date().toISOString()
    }]);
    setUnreadNotifications(prev => prev + 1);
    fetchInterviews();
  };

  const handleInterviewReminder = (data) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'reminder',
      message: `Interview starting in 15 minutes: ${data.job}`,
      timestamp: new Date().toISOString()
    }]);
    setUnreadNotifications(prev => prev + 1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <VideoCall />;
      case 'onsite': return <LocationOn />;
      case 'phone': return <Phone />;
      default: return <Event />;
    }
  };

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview);
    setDetailsOpen(true);
  };

  const handleJoinInterview = (interview) => {
    if (interview.type === 'video') {
      navigate(`/interview/${interview._id || interview.id}`);
    } else if (interview.meetLink) {
      window.open(interview.meetLink, '_blank');
    }
  };

  const handleStartChat = (interview) => {
    const otherParticipant = interview.candidate?._id === user?.id 
      ? interview.interviewer 
      : interview.candidate;
    navigate(`/chat?user=${otherParticipant?._id || 'unknown'}`);
  };

  const refreshInterviews = () => {
    setLoading(true);
    fetchInterviews();
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const upcomingInterviews = interviews.filter(interview => 
    ['scheduled', 'confirmed'].includes(interview.status) && 
    new Date(interview.scheduledAt) > new Date()
  );
  const pastInterviews = interviews.filter(interview => 
    interview.status === 'completed' || 
    (interview.status === 'scheduled' && new Date(interview.scheduledAt) < new Date())
  );
  const ongoingInterviews = interviews.filter(interview => 
    interview.status === 'in_progress'
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Interviews
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={refreshInterviews}
            startIcon={<Refresh />}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          <Badge badgeContent={unreadNotifications} color="error">
            <Button
              onClick={clearNotifications}
              startIcon={<Notifications />}
              variant="outlined"
              size="small"
            >
              Notifications
            </Button>
          </Badge>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Ongoing Interviews Alert */}
      {ongoingInterviews.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {ongoingInterviews.length} ongoing interview{ongoingInterviews.length !== 1 ? 's' : ''}!
          {ongoingInterviews.map(interview => (
            <Button
              key={interview._id || interview.id}
              size="small"
              onClick={() => handleJoinInterview(interview)}
              sx={{ ml: 2 }}
            >
              Join {interview.job?.title}
            </Button>
          ))}
        </Alert>
      )}

      {upcomingInterviews.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {upcomingInterviews.length} upcoming interview{upcomingInterviews.length !== 1 ? 's' : ''}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Upcoming Interviews */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Interviews
              </Typography>
              <List>
                {upcomingInterviews.map((interview, index) => (
                  <React.Fragment key={interview._id || interview.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getTypeIcon(interview.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                              {interview.job?.title || 'Interview'}
                            </Typography>
                            <Chip
                              label={interview.status}
                              color={getStatusColor(interview.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {interview.job?.company || 'Company'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(interview.scheduledAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Duration: {interview.duration} minutes
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleViewDetails(interview)}
                              >
                                Details
                              </Button>
                              {interview.type === 'video' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleJoinInterview(interview)}
                                  startIcon={<VideoCall />}
                                >
                                  Join Video
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleStartChat(interview)}
                                startIcon={<Chat />}
                              >
                                Chat
                              </Button>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingInterviews.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {upcomingInterviews.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No upcoming interviews"
                      secondary="Your scheduled interviews will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Past Interviews */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Past Interviews
              </Typography>
              <List>
                {pastInterviews.map((interview, index) => (
                  <React.Fragment key={interview._id || interview.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getTypeIcon(interview.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                              {interview.job?.title || 'Interview'}
                            </Typography>
                            <Chip
                              label={interview.status}
                              color={getStatusColor(interview.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {interview.job?.company || 'Company'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(interview.scheduledAt).toLocaleString()}
                            </Typography>
                            {interview.rating && (
                              <Typography variant="body2" color="primary">
                                Rating: {interview.rating}/5 ⭐
                              </Typography>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(interview)}
                              sx={{ mt: 1 }}
                            >
                              View Details
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pastInterviews.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {pastInterviews.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No past interviews"
                      secondary="Your completed interviews will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Interview Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Interview Details</DialogTitle>
        <DialogContent>
          {selectedInterview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInterview.job?.title || 'Interview'}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedInterview.job?.company || 'Company'}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Event sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {new Date(selectedInterview.scheduledAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getTypeIcon(selectedInterview.type)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {selectedInterview.type === 'video' ? 'Video Call' : 
                       selectedInterview.type === 'onsite' ? 'On-site' : 'Phone Call'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTime sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.duration} minutes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.interviewer?.firstName} {selectedInterview.interviewer?.lastName}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Email sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.interviewer?.email}
                    </Typography>
                  </Box>
                </Grid>
                
                {selectedInterview.meetLink && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <VideoCall sx={{ mr: 1 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleJoinInterview(selectedInterview)}
                      >
                        Join Meeting
                      </Button>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedInterview.notes || 'No notes available'}
                  </Typography>
                </Grid>

                {selectedInterview.feedback && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Feedback
                    </Typography>
                    <Typography variant="body1">
                      {selectedInterview.feedback}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedInterview?.type === 'video' && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleJoinInterview(selectedInterview);
                setDetailsOpen(false);
              }}
              startIcon={<VideoCall />}
            >
              Join Interview
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Chat Fab */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => navigate('/chat')}
      >
        <Chat />
      </Fab>
    </Box>
  );
};

export default InterviewsPageEnhanced;