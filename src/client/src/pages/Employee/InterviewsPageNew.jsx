import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Tabs, Tab,
  Paper, Divider, Tooltip
} from '@mui/material';
import {
  Schedule, VideoCall, Phone, Business, LocationOn,
  CalendarToday, AccessTime, Chat, CheckCircle,
  Cancel, Pending, Event
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
const InterviewsPageNew = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);

  const interviewStatuses = [
    { value: 'scheduled', label: 'Scheduled', color: 'primary' },
    { value: 'confirmed', label: 'Confirmed', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'info' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ];

  const interviewTypes = [
    { value: 'video', label: 'Video Call', icon: <VideoCall /> },
    { value: 'phone', label: 'Phone Call', icon: <Phone /> },
    { value: 'onsite', label: 'On-site', icon: <Business /> }
  ];

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getInterviews();
      setInterviews(response.interviews || []);
    } catch (error) {
      setError('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await employeeService.updateInterviewStatus(selectedInterview._id, status);
      setSuccess(`Interview ${status} successfully`);
      setStatusDialog(false);
      setSelectedInterview(null);
      loadInterviews();
    } catch (error) {
      setError('Failed to update interview status');
    }
  };

  const getInterviewsByStatus = (status) => {
    return interviews.filter(interview => interview.status === status);
  };

  const getUpcomingInterviews = () => {
    const now = new Date();
    return interviews.filter(interview => 
      new Date(interview.scheduledAt) > now && 
      ['scheduled', 'confirmed'].includes(interview.status)
    );
  };

  const getPastInterviews = () => {
    const now = new Date();
    return interviews.filter(interview => 
      new Date(interview.scheduledAt) <= now || 
      ['completed', 'cancelled'].includes(interview.status)
    );
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusObj = interviewStatuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const canJoinInterview = (interview) => {
    const now = new Date();
    const interviewTime = new Date(interview.scheduledAt);
    const timeDiff = interviewTime.getTime() - now.getTime();
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -30 * 60 * 1000; // 15 min before to 30 min after
  };

  const InterviewCard = ({ interview }) => (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {interview.job?.title}
              </Typography>
              <Chip
                size="small"
                label={interview.status}
                color={getStatusColor(interview.status)}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {interview.job?.company}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2">
                  {formatDateTime(interview.scheduledAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  {interview.duration} minutes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {interviewTypes.find(t => t.value === interview.type)?.icon}
                <Typography variant="body2">
                  {interviewTypes.find(t => t.value === interview.type)?.label}
                </Typography>
              </Box>
            </Box>
            
            {interview.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Description:</strong> {interview.description}
              </Typography>
            )}
            
            {interview.notes && (
              <Typography variant="body2" color="text.secondary">
                <strong>Notes:</strong> {interview.notes}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {interview.type === 'video' && interview.meetLink && (
              <Button
                variant="contained"
                startIcon={<VideoCall />}
                onClick={() => window.open(interview.meetLink, '_blank')}
                disabled={!canJoinInterview(interview) || interview.status === 'cancelled'}
                size="small"
              >
                Join Call
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Chat />}
              onClick={() => navigate(`/chat?user=${interview.interviewer._id}`)}
              size="small"
            >
              Message
            </Button>
            
            {['scheduled'].includes(interview.status) && (
              <Button
                variant="outlined"
                color="success"
                onClick={() => {
                  setSelectedInterview(interview);
                  setStatusDialog(true);
                }}
                size="small"
              >
                Confirm
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Interviews
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your scheduled interviews
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Interview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {getUpcomingInterviews().length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {getInterviewsByStatus('completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {interviews.filter(i => i.type === 'video').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Video Calls
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {getInterviewsByStatus('cancelled').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('common.status.cancelled')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Interview Lists */}
      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Upcoming (${getUpcomingInterviews().length})`} />
          <Tab label={`Past (${getPastInterviews().length})`} />
          <Tab label="All Interviews" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {(tabValue === 0 ? getUpcomingInterviews() : 
                tabValue === 1 ? getPastInterviews() : interviews)
                .map((interview) => (
                  <InterviewCard key={interview._id} interview={interview} />
                ))}

              {(tabValue === 0 ? getUpcomingInterviews() : 
                tabValue === 1 ? getPastInterviews() : interviews).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No interviews found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'No upcoming interviews scheduled' : 
                     tabValue === 1 ? 'No past interviews' :
                     'No interviews scheduled yet'}
                  </Typography>
                  {tabValue === 0 && (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/jobs/search')}
                      sx={{ mt: 2 }}
                    >
                      Apply to Jobs
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Interview Status</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Update status for interview: {selectedInterview?.job?.title}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                onClick={() => handleUpdateStatus('confirmed')}
              >
                Confirm
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => handleUpdateStatus('declined')}
              >
                Decline
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewsPageNew;