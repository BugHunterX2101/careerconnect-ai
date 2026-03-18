import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Chip, IconButton, Alert, CircularProgress, Tabs, Tab,
  Paper, Divider, Badge, Tooltip
} from '@mui/material';
import {
  Schedule, VideoCall, Phone, Business, Edit, Delete,
  AccessTime, CalendarToday, Person, Work, Chat,
  Link as LinkIcon, Cancel, CheckCircle
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FixedSizeList } from 'react-window';
import { employerService } from '../../services/employerService';
import { useNavigate } from 'react-router-dom';
const InterviewSchedulerPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  
  const [interviewData, setInterviewData] = useState({
    jobId: '',
    candidateId: '',
    scheduledAt: new Date(),
    duration: 60,
    type: 'video',
    notes: '',
    description: ''
  });

  const interviewTypes = [
    { value: 'video', label: 'Video Call', icon: <VideoCall /> },
    { value: 'phone', label: 'Phone Call', icon: <Phone /> },
    { value: 'onsite', label: 'On-site', icon: <Business /> }
  ];

  const durations = [30, 45, 60, 90, 120];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interviewsData, jobsData] = await Promise.all([
        employerService.getInterviews(),
        employerService.getJobs({ status: 'active' })
      ]);
      
      setInterviews(interviewsData.interviews || []);
      setJobs(jobsData.jobs || []);
    } catch (error) {
      setError('Failed to load data');
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForJob = async (jobId) => {
    try {
      const response = await employerService.getJobApplicants(jobId);
      setCandidates(response.applications || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      setLoading(true);
      setError('');
      
      await employerService.scheduleInterview(interviewData);
      setSuccess('Interview scheduled successfully!');
      setScheduleDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInterview = async () => {
    try {
      setLoading(true);
      setError('');
      
      await employerService.updateInterview(selectedInterview._id, interviewData);
      setSuccess('Interview updated successfully!');
      setEditDialog(false);
      setSelectedInterview(null);
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update interview');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInterview = async (interviewId) => {
    try {
      await employerService.cancelInterview(interviewId);
      setSuccess('Interview cancelled successfully!');
      loadData();
    } catch (error) {
      setError('Failed to cancel interview');
    }
  };

  const resetForm = () => {
    setInterviewData({
      jobId: '',
      candidateId: '',
      scheduledAt: new Date(),
      duration: 60,
      type: 'video',
      notes: '',
      description: ''
    });
    setCandidates([]);
  };

  const openEditDialog = (interview) => {
    setSelectedInterview(interview);
    setInterviewData({
      jobId: interview.job._id,
      candidateId: interview.candidate._id,
      scheduledAt: new Date(interview.scheduledAt),
      duration: interview.duration,
      type: interview.type,
      notes: interview.notes || '',
      description: interview.description || ''
    });
    loadCandidatesForJob(interview.job._id);
    setEditDialog(true);
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
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((interview) =>
      new Date(interview.scheduledAt) > now &&
      ['scheduled', 'confirmed'].includes(interview.status)
    );
  }, [interviews]);

  const pastInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((interview) =>
      new Date(interview.scheduledAt) <= now ||
      ['completed', 'cancelled'].includes(interview.status)
    );
  }, [interviews]);

  const displayedInterviews = useMemo(() => {
    if (tabValue === 0) return upcomingInterviews;
    if (tabValue === 1) return pastInterviews;
    return interviews;
  }, [interviews, pastInterviews, tabValue, upcomingInterviews]);

  const listHeight = useMemo(() => {
    if (displayedInterviews.length === 0) return 0;
    return Math.min(720, displayedInterviews.length * 168);
  }, [displayedInterviews.length]);

  const InterviewRow = useCallback(({ index, style }) => {
    const interview = displayedInterviews[index];
    if (!interview) return null;

    return (
      <Box style={style} sx={{ px: 0.5, py: 0.5 }}>
        <ListItem
          key={interview._id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemAvatar>
            <Avatar src={interview.candidate?.profile?.avatar}>
              {interview.candidate?.firstName?.[0]}
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {interview.candidate?.firstName} {interview.candidate?.lastName}
                </Typography>
                <Chip
                  size="small"
                  label={interview.status}
                  color={getStatusColor(interview.status)}
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {interview.job?.title} • {interview.job?.company}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="caption">
                      {formatDateTime(interview.scheduledAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="caption">
                      {interview.duration} minutes
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {interviewTypes.find(t => t.value === interview.type)?.icon}
                    <Typography variant="caption">
                      {interviewTypes.find(t => t.value === interview.type)?.label}
                    </Typography>
                  </Box>
                </Box>

                {interview.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Notes: {interview.notes}
                  </Typography>
                )}
              </Box>
            }
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {interview.type === 'video' && interview.meetLink && (
              <Tooltip title="Join Video Call">
                <IconButton
                  size="small"
                  onClick={() => window.open(interview.meetLink, '_blank')}
                  disabled={interview.status === 'cancelled'}
                >
                  <VideoCall />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Message Candidate">
              <IconButton
                size="small"
                onClick={() => navigate(`/chat?user=${interview.candidate._id}`)}
              >
                <Chat />
              </IconButton>
            </Tooltip>

            {['scheduled', 'confirmed'].includes(interview.status) && (
              <>
                <Tooltip title="Edit Interview">
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(interview)}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Cancel Interview">
                  <IconButton
                    size="small"
                    onClick={() => handleCancelInterview(interview._id)}
                    color="error"
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </ListItem>
      </Box>
    );
  }, [displayedInterviews, interviewTypes, navigate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Interview Scheduler
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule and manage candidate interviews
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Schedule />}
            onClick={() => setScheduleDialog(true)}
            size="large"
          >
            Schedule Interview
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Upcoming</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {upcomingInterviews.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Completed</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {interviews.filter(i => i.status === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VideoCall sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">{t('videoCalls')}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {interviews.filter(i => i.type === 'video').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Cancel sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Cancelled</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {interviews.filter(i => i.status === 'cancelled').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Interview Lists */}
        <Paper>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`${t('upcoming')} (${upcomingInterviews.length})`} />
            <Tab label={`${t('past')} (${pastInterviews.length})`} />
            <Tab label={t('allInterviews')} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {displayedInterviews.length > 0 ? (
                  <FixedSizeList
                    height={listHeight}
                    width="100%"
                    itemCount={displayedInterviews.length}
                    itemSize={168}
                  >
                    {InterviewRow}
                  </FixedSizeList>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No interviews {tabValue === 0 ? 'scheduled' : tabValue === 1 ? 'completed' : 'found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tabValue === 0 ? 'Schedule your first interview' : 'Interviews will appear here'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Schedule Interview Dialog */}
        <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Schedule New Interview</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Job</InputLabel>
                  <Select
                    value={interviewData.jobId}
                    onChange={(e) => {
                      setInterviewData(prev => ({ ...prev, jobId: e.target.value }));
                      loadCandidatesForJob(e.target.value);
                    }}
                  >
                    {jobs.map(job => (
                      <MenuItem key={job._id} value={job._id}>
                        {job.title} - {job.location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!interviewData.jobId}>
                  <InputLabel>{t('selectCandidate')}</InputLabel>
                  <Select
                    value={interviewData.candidateId}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, candidateId: e.target.value }))}
                  >
                    {candidates.map(application => (
                      <MenuItem key={application._id} value={application.applicant._id}>
                        {application.applicant.firstName} {application.applicant.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Interview Date & Time"
                  value={interviewData.scheduledAt}
                  onChange={(newValue) => setInterviewData(prev => ({ ...prev, scheduledAt: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDateTime={new Date()}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('durationMinutes')}</InputLabel>
                  <Select
                    value={interviewData.duration}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, duration: e.target.value }))}
                  >
                    {durations.map(duration => (
                      <MenuItem key={duration} value={duration}>
                        {duration} minutes
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('interviewType')}</InputLabel>
                  <Select
                    value={interviewData.type}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {interviewTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={interviewData.description}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the interview"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('notes')}
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('additionalNotesPlaceholder')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleScheduleInterview}
              disabled={loading || !interviewData.jobId || !interviewData.candidateId}
            >
              {loading ? <CircularProgress size={20} /> : 'Schedule Interview'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Interview Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Interview</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Interview Date & Time"
                  value={interviewData.scheduledAt}
                  onChange={(newValue) => setInterviewData(prev => ({ ...prev, scheduledAt: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDateTime={new Date()}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Duration (minutes)</InputLabel>
                  <Select
                    value={interviewData.duration}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, duration: e.target.value }))}
                  >
                    {durations.map(duration => (
                      <MenuItem key={duration} value={duration}>
                        {duration} minutes
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={interviewData.description}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleUpdateInterview}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Update Interview'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default InterviewSchedulerPage;
