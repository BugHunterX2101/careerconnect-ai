import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Event,
  VideoCall,
  LocationOn,
  AccessTime,
  Person,
  Phone,
  Email,
  ArrowBack
} from '@mui/icons-material';
import { FixedSizeList } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';

const InterviewsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await employeeService.getInterviews();
      const list = Array.isArray(data?.interviews) ? data.interviews : [];
      setInterviews(list);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Could not load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'cancelled':
      case 'declined': return 'error';
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
    const link = interview.meetingLink || interview.videoLink;
    if (link) {
      window.open(link, '_blank');
    }
  };

  const formatDate = (interview) => {
    if (interview.scheduledAt) {
      const d = new Date(interview.scheduledAt);
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (interview.date) {
      return `${interview.date}${interview.time ? ` at ${interview.time}` : ''}`;
    }
    return 'Date TBD';
  };

  const upcomingInterviews = useMemo(
    () => interviews.filter((i) => ['scheduled', 'confirmed'].includes(i.status)),
    [interviews]
  );
  const pastInterviews = useMemo(
    () => interviews.filter((i) => ['completed', 'cancelled', 'declined'].includes(i.status)),
    [interviews]
  );

  const upcomingListHeight = useMemo(() => Math.min(520, upcomingInterviews.length * 168), [upcomingInterviews.length]);
  const pastListHeight = useMemo(() => Math.min(520, pastInterviews.length * 150), [pastInterviews.length]);

  const UpcomingRow = useCallback(({ index, style }) => {
    const interview = upcomingInterviews[index];
    if (!interview) return null;
    const jobTitle = interview.job?.title || interview.jobTitle || 'Interview';
    const company = interview.job?.company || interview.company || '';
    const type = interview.type || 'video';
    const hasMeetingLink = !!(interview.meetingLink || interview.videoLink);

    return (
      <Box style={style} sx={{ px: 0.5, pb: 0.5 }}>
        <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <ListItemIcon>{getTypeIcon(type)}</ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{jobTitle}</Typography>
                <Chip label={interview.status} color={getStatusColor(interview.status)} size="small" />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="textSecondary">{company}</Typography>
                <Typography variant="body2" color="textSecondary">{formatDate(interview)}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetails(interview)}
                    sx={{
                      mr: 1,
                      color: '#8B6F47',
                      borderColor: 'rgba(139, 111, 71, 0.3)',
                      textTransform: 'none',
                      '&:hover': { borderColor: '#8B6F47', backgroundColor: 'rgba(139, 111, 71, 0.05)' }
                    }}
                  >
                    Details
                  </Button>
                  {hasMeetingLink && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleJoinInterview(interview)}
                      sx={{
                        background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                        color: '#FAF3E0',
                        textTransform: 'none',
                        '&:hover': { background: 'linear-gradient(135deg, #6B5544 0%, #8B6F47 100%)' }
                      }}
                    >
                      Join
                    </Button>
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>
      </Box>
    );
  }, [upcomingInterviews]);

  const PastRow = useCallback(({ index, style }) => {
    const interview = pastInterviews[index];
    if (!interview) return null;
    const jobTitle = interview.job?.title || interview.jobTitle || 'Interview';
    const company = interview.job?.company || interview.company || '';

    return (
      <Box style={style} sx={{ px: 0.5, pb: 0.5 }}>
        <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <ListItemIcon>{getTypeIcon(interview.type)}</ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{jobTitle}</Typography>
                <Chip label={interview.status} color={getStatusColor(interview.status)} size="small" />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="textSecondary">{company}</Typography>
                <Typography variant="body2" color="textSecondary">{formatDate(interview)}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewDetails(interview)}
                  sx={{
                    mt: 1,
                    color: '#8B6F47',
                    borderColor: 'rgba(139, 111, 71, 0.3)',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#8B6F47', backgroundColor: 'rgba(139, 111, 71, 0.05)' }
                  }}
                >
                  View Details
                </Button>
              </Box>
            }
          />
        </ListItem>
      </Box>
    );
  }, [pastInterviews]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h3" sx={{
          fontWeight: 700,
          fontSize: '2rem',
          color: '#6B5544',
          letterSpacing: '-0.5px'
        }}>
          My Interviews
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#8B6F47' }} />
        </Box>
      ) : (
        <>
          {upcomingInterviews.length > 0 && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(139, 111, 71, 0.1)',
                color: '#6B5544',
                border: '1px solid rgba(139, 111, 71, 0.3)',
                '& .MuiAlert-icon': { color: '#8B6F47' }
              }}
            >
              You have {upcomingInterviews.length} upcoming interview{upcomingInterviews.length !== 1 ? 's' : ''}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{
                background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
                border: '1px solid rgba(139, 111, 71, 0.15)',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#6B5544', mb: 2, fontSize: '1.2rem' }}>
                    Upcoming Interviews
                  </Typography>
                  <List>
                    {upcomingInterviews.length > 0 ? (
                      <FixedSizeList
                        height={upcomingListHeight}
                        width="100%"
                        itemCount={upcomingInterviews.length}
                        itemSize={168}
                      >
                        {UpcomingRow}
                      </FixedSizeList>
                    ) : (
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

            <Grid item xs={12} md={6}>
              <Card sx={{
                background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
                border: '1px solid rgba(139, 111, 71, 0.15)',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#6B5544', mb: 2, fontSize: '1.2rem' }}>
                    Past Interviews
                  </Typography>
                  <List>
                    {pastInterviews.length > 0 ? (
                      <FixedSizeList
                        height={pastListHeight}
                        width="100%"
                        itemCount={pastInterviews.length}
                        itemSize={150}
                      >
                        {PastRow}
                      </FixedSizeList>
                    ) : (
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
        </>
      )}

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
            border: '1px solid rgba(139, 111, 71, 0.15)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#6B5544', fontSize: '1.35rem' }}>Interview Details</DialogTitle>
        <DialogContent>
          {selectedInterview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInterview.job?.title || selectedInterview.jobTitle || 'Interview'}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedInterview.job?.company || selectedInterview.company}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Event sx={{ mr: 1 }} />
                    <Typography variant="body2">{formatDate(selectedInterview)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getTypeIcon(selectedInterview.type)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {selectedInterview.type === 'video' ? 'Video Call' :
                       selectedInterview.type === 'onsite' ? 'On-Site' : 'Phone Call'}
                    </Typography>
                  </Box>
                </Grid>
                {selectedInterview.interviewer && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Person sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {selectedInterview.interviewer?.name || selectedInterview.interviewer}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {(selectedInterview.interviewer?.email || selectedInterview.interviewerEmail) && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Email sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {selectedInterview.interviewer?.email || selectedInterview.interviewerEmail}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {(selectedInterview.meetingLink || selectedInterview.videoLink) && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <VideoCall sx={{ mr: 1, color: '#8B6F47' }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleJoinInterview(selectedInterview)}
                        sx={{
                          color: '#8B6F47',
                          borderColor: 'rgba(139, 111, 71, 0.3)',
                          textTransform: 'none',
                          '&:hover': { borderColor: '#8B6F47', backgroundColor: 'rgba(139, 111, 71, 0.05)' }
                        }}
                      >
                        Join Meeting
                      </Button>
                    </Box>
                  </Grid>
                )}
                {(selectedInterview.notes || selectedInterview.feedback) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Notes</Typography>
                    <Typography variant="body1">
                      {selectedInterview.notes || selectedInterview.feedback}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDetailsOpen(false)}
            sx={{
              color: '#8B6F47',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(139, 111, 71, 0.1)' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewsPage;
