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
  TextField,
  Alert
} from '@mui/material';
import {
  Event,
  VideoCall,
  LocationOn,
  AccessTime,
  Person,
  Phone,
  Email
} from '@mui/icons-material';
import { FixedSizeList } from 'react-window';
const InterviewsPage = () => {
  const { t } = useTranslation();
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const mockInterviews = [
        {
          id: 1,
          jobTitle: 'Frontend Developer',
          company: 'Tech Corp',
          date: '2024-01-20',
          time: '2:00 PM',
          type: 'video',
          status: 'scheduled',
          interviewer: 'John Smith',
          interviewerEmail: 'john.smith@techcorp.com',
          meetingLink: 'https://meet.google.com/abc-def-ghi',
          notes: 'Technical interview focusing on React and JavaScript'
        },
        {
          id: 2,
          jobTitle: 'React Developer',
          company: 'StartupXYZ',
          date: '2024-01-22',
          time: '10:00 AM',
          type: 'in-person',
          status: 'scheduled',
          interviewer: 'Sarah Johnson',
          interviewerEmail: 'sarah@startupxyz.com',
          location: '123 Main St, New York, NY',
          notes: 'First round interview with HR and technical lead'
        },
        {
          id: 3,
          jobTitle: 'Full Stack Engineer',
          company: 'BigTech Inc',
          date: '2024-01-18',
          time: '3:30 PM',
          type: 'video',
          status: 'completed',
          interviewer: 'Mike Davis',
          interviewerEmail: 'mike.davis@bigtech.com',
          meetingLink: 'https://zoom.us/j/123456789',
          notes: 'Final round interview with engineering manager'
        }
      ];
      setInterviews(mockInterviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <VideoCall />;
      case 'in-person': return <LocationOn />;
      case 'phone': return <Phone />;
      default: return <Event />;
    }
  };

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview);
    setDetailsOpen(true);
  };

  const handleJoinInterview = (interview) => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    }
  };

  const upcomingInterviews = useMemo(() => interviews.filter((interview) => interview.status === 'scheduled'), [interviews]);
  const pastInterviews = useMemo(() => interviews.filter((interview) => interview.status === 'completed'), [interviews]);

  const upcomingListHeight = useMemo(() => {
    if (upcomingInterviews.length === 0) return 0;
    return Math.min(520, upcomingInterviews.length * 168);
  }, [upcomingInterviews.length]);

  const pastListHeight = useMemo(() => {
    if (pastInterviews.length === 0) return 0;
    return Math.min(520, pastInterviews.length * 150);
  }, [pastInterviews.length]);

  const UpcomingRow = useCallback(({ index, style }) => {
    const interview = upcomingInterviews[index];
    if (!interview) return null;

    return (
      <Box style={style} sx={{ px: 0.5, pb: 0.5 }}>
        <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <ListItemIcon>
            {getTypeIcon(interview.type)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  {interview.jobTitle}
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
                  {interview.company}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {interview.date} at {interview.time}
                </Typography>
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
                      '&:hover': {
                        borderColor: '#8B6F47',
                        backgroundColor: 'rgba(139, 111, 71, 0.05)'
                      }
                    }}
                  >
                    Details
                  </Button>
                  {interview.type === 'video' && interview.meetingLink && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleJoinInterview(interview)}
                      sx={{
                        background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                        color: '#FAF3E0',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6B5544 0%, #8B6F47 100%)'
                        }
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
    )
  }, [upcomingInterviews]);

  const PastRow = useCallback(({ index, style }) => {
    const interview = pastInterviews[index];
    if (!interview) return null;

    return (
      <Box style={style} sx={{ px: 0.5, pb: 0.5 }}>
        <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <ListItemIcon>
            {getTypeIcon(interview.type)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  {interview.jobTitle}
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
                  {interview.company}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {interview.date} at {interview.time}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewDetails(interview)}
                  sx={{
                    mt: 1,
                    color: '#8B6F47',
                    borderColor: 'rgba(139, 111, 71, 0.3)',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#8B6F47',
                      backgroundColor: 'rgba(139, 111, 71, 0.05)'
                    }
                  }}
                >
                  View Details
                </Button>
              </Box>
            }
          />
        </ListItem>
      </Box>
    )
  }, [pastInterviews]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ 
        fontWeight: 700, 
        fontSize: '2rem', 
        color: '#6B5544',
        letterSpacing: '-0.5px',
        mb: 3
      }}>
        My Interviews
      </Typography>

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
        {/* Upcoming Interviews */}
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
                {upcomingInterviews.length > 0 && (
                  <FixedSizeList
                    height={upcomingListHeight}
                    width="100%"
                    itemCount={upcomingInterviews.length}
                    itemSize={168}
                  >
                    {UpcomingRow}
                  </FixedSizeList>
                )}
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
                {pastInterviews.length > 0 && (
                  <FixedSizeList
                    height={pastListHeight}
                    width="100%"
                    itemCount={pastInterviews.length}
                    itemSize={150}
                  >
                    {PastRow}
                  </FixedSizeList>
                )}
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
                {selectedInterview.jobTitle}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedInterview.company}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Event sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.date} at {selectedInterview.time}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getTypeIcon(selectedInterview.type)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {selectedInterview.type === 'video' ? 'Video Call' : 
                       selectedInterview.type === 'in-person' ? 'In Person' : 'Phone Call'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.interviewer}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Email sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedInterview.interviewerEmail}
                    </Typography>
                  </Box>
                </Grid>
                
                {selectedInterview.location && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocationOn sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {selectedInterview.location}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {selectedInterview.meetingLink && (
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
                          '&:hover': {
                            borderColor: '#8B6F47',
                            backgroundColor: 'rgba(139, 111, 71, 0.05)'
                          }
                        }}
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
                    {selectedInterview.notes}
                  </Typography>
                </Grid>
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
