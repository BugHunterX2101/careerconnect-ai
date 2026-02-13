import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Grid, Chip, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Menu, MenuItem, Alert, CircularProgress,
  Tabs, Tab, Paper, Divider, Badge, Tooltip, FormControl,
  InputLabel, Select, Checkbox, FormControlLabel
} from '@mui/material';
import {
  People, Visibility, Email, Phone, Schedule, Chat,
  Download, FilterList, MoreVert, CheckCircle, Cancel,
  Star, StarBorder, LocationOn, Work, School, CalendarToday
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { employerService } from '../../services/employerService';

const ApplicantsPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(jobId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileDialog, setProfileDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    experience: '',
    location: ''
  });

  const applicationStatuses = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'reviewed', label: 'Reviewed', color: 'info' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'primary' },
    { value: 'interview', label: 'Interview', color: 'secondary' },
    { value: 'hired', label: 'Hired', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' }
  ];

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadApplicants();
    }
  }, [selectedJob, filters]);

  const loadJobs = async () => {
    try {
      const response = await employerService.getJobs();
      setJobs(response.jobs || []);
      if (!selectedJob && response.jobs?.length > 0) {
        setSelectedJob(response.jobs[0]._id);
      }
    } catch (error) {
      setError('Failed to load jobs');
    }
  };

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const response = await employerService.getJobApplicants(selectedJob, filters);
      setApplicants(response.applications || []);
    } catch (error) {
      setError('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicantId, status, notes = '') => {
    try {
      await employerService.updateApplicantStatus(selectedJob, applicantId, status, notes);
      setSuccess(`Application status updated to ${status}`);
      loadApplicants();
      setStatusDialog(false);
    } catch (error) {
      setError('Failed to update application status');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      await employerService.bulkUpdateApplicants(selectedJob, selectedApplicants, status);
      setSuccess(`${selectedApplicants.length} applications updated to ${status}`);
      setSelectedApplicants([]);
      loadApplicants();
    } catch (error) {
      setError('Failed to update applications');
    }
  };

  const handleDownloadResume = async (applicantId) => {
    try {
      const resumeBlob = await employerService.downloadApplicantResume(selectedJob, applicantId);
      const url = window.URL.createObjectURL(resumeBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${applicantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download resume');
    }
  };

  const handleScheduleInterview = (applicant) => {
    navigate('/employer/interviews/schedule', {
      state: {
        jobId: selectedJob,
        candidateId: applicant.applicant._id,
        candidateName: `${applicant.applicant.firstName} ${applicant.applicant.lastName}`
      }
    });
  };

  const getApplicantsByStatus = (status) => {
    return applicants.filter(app => app.status === status);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusObj = applicationStatuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const ApplicantCard = ({ applicant }) => (
    <Card sx={{ 
      mb: 2, 
      background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
      border: '1px solid rgba(139, 111, 71, 0.15)',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': { 
        boxShadow: '0 4px 12px rgba(139, 111, 71, 0.15)',
        transform: 'translateY(-2px)'
      } 
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedApplicants.includes(applicant._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedApplicants(prev => [...prev, applicant._id]);
                  } else {
                    setSelectedApplicants(prev => prev.filter(id => id !== applicant._id));
                  }
                }}
              />
            }
            label=""
          />
          
          <Avatar
            src={applicant.applicant?.profile?.avatar}
            sx={{ width: 60, height: 60 }}
          >
            {applicant.applicant?.firstName?.[0]}{applicant.applicant?.lastName?.[0]}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {applicant.applicant?.firstName} {applicant.applicant?.lastName}
              </Typography>
              <Chip
                size="small"
                label={applicant.status}
                color={getStatusColor(applicant.status)}
              />
              {applicant.starred && (
                <Star color="warning" fontSize="small" />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {applicant.applicant?.profile?.title || 'Professional'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="caption">
                  {applicant.applicant?.email}
                </Typography>
              </Box>
              {applicant.applicant?.profile?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="caption">
                    {applicant.applicant.profile.phone}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="caption">
                  {applicant.applicant?.profile?.location || 'Not specified'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Work fontSize="small" color="action" />
                <Typography variant="caption">
                  {applicant.applicant?.profile?.experience?.years || 0} years experience
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="caption">
                  {`Applied ${formatDate(applicant.appliedAt)}`}
                </Typography>
              </Box>
            </Box>
            
            {applicant.applicant?.profile?.skills && (
              <Box sx={{ mb: 2 }}>
                {applicant.applicant.profile.skills.slice(0, 4).map((skill, index) => (
                  <Chip key={index} label={skill} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
                {applicant.applicant.profile.skills.length > 4 && (
                  <Chip 
                    label={`+${applicant.applicant.profile.skills.length - 4} more`} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            )}
            
            {applicant.coverLetter && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Cover Letter:</strong> {applicant.coverLetter.substring(0, 100)}...
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title="View Profile">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedApplicant(applicant);
                  setProfileDialog(true);
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download Resume">
              <IconButton
                size="small"
                onClick={() => handleDownloadResume(applicant._id)}
              >
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Message Candidate">
              <IconButton
                size="small"
                onClick={() => navigate(`/chat?user=${applicant.applicant._id}`)}
              >
                <Chat />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Schedule Interview">
              <IconButton
                size="small"
                onClick={() => handleScheduleInterview(applicant)}
              >
                <Schedule />
              </IconButton>
            </Tooltip>
            
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedApplicant(applicant);
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h3" gutterBottom sx={{ 
        fontWeight: 700, 
        fontSize: '2.5rem', 
        color: '#6B5544',
        letterSpacing: '-0.5px'
      }}>
        Applicant Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, color: '#8B6F47', fontSize: '1.125rem' }}>
        Review and manage job applications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Job Selection and Filters */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Job</InputLabel>
                <Select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                >
                  {jobs.map(job => (
                    <MenuItem key={job._id} value={job._id}>
                      {job.title} ({job.applications?.length || 0} applications)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {applicationStatuses.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Min Experience"
                type="number"
                value={filters.experience}
                onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              {selectedApplicants.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setStatusDialog(true)}
                  fullWidth
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
                  Update Selected ({selectedApplicants.length})
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedJob && (
        <>
          {/* Application Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {applicationStatuses.map(status => (
              <Grid item xs={12} sm={6} md={2} key={status.value}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
                  border: '1px solid rgba(139, 111, 71, 0.15)',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(139, 111, 71, 0.15)'
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B5544', fontSize: '2.75rem' }}>
                      {getApplicantsByStatus(status.value).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8B6F47', mt: 0.5, fontSize: '1.05rem' }}>
                      {status.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Applicant Lists */}
          <Paper sx={{
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
                  color: '#8B6F47',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#6B5544'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8B6F47',
                  height: 2
                }
              }}
            >
              <Tab label={`All (${applicants.length})`} />
              <Tab label={`Pending (${getApplicantsByStatus('pending').length})`} />
              <Tab label={`Shortlisted (${getApplicantsByStatus('shortlisted').length})`} />
              <Tab label={`Interview (${getApplicantsByStatus('interview').length})`} />
              <Tab label={`Hired (${getApplicantsByStatus('hired').length})`} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {(tabValue === 0 ? applicants :
                    tabValue === 1 ? getApplicantsByStatus('pending') :
                    tabValue === 2 ? getApplicantsByStatus('shortlisted') :
                    tabValue === 3 ? getApplicantsByStatus('interview') :
                    getApplicantsByStatus('hired'))
                    .map((applicant) => (
                      <ApplicantCard key={applicant._id} applicant={applicant} />
                    ))}

                  {(tabValue === 0 ? applicants :
                    tabValue === 1 ? getApplicantsByStatus('pending') :
                    tabValue === 2 ? getApplicantsByStatus('shortlisted') :
                    tabValue === 3 ? getApplicantsByStatus('interview') :
                    getApplicantsByStatus('hired')).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No applicants found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applications will appear here when candidates apply
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Applicant Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setProfileDialog(true);
          setAnchorEl(null);
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Full Profile
        </MenuItem>
        <MenuItem onClick={() => {
          handleDownloadResume(selectedApplicant?._id);
          setAnchorEl(null);
        }}>
          <Download sx={{ mr: 1 }} />
          Download Resume
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/chat?user=${selectedApplicant?.applicant._id}`);
          setAnchorEl(null);
        }}>
          <Chat sx={{ mr: 1 }} />
          Message Candidate
        </MenuItem>
        <MenuItem onClick={() => {
          handleScheduleInterview(selectedApplicant);
          setAnchorEl(null);
        }}>
          <Schedule sx={{ mr: 1 }} />
          Schedule Interview
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleStatusUpdate(selectedApplicant?._id, 'shortlisted');
            setAnchorEl(null);
          }}
          sx={{ color: 'primary.main' }}
        >
          <CheckCircle sx={{ mr: 1 }} />
          Shortlist
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleStatusUpdate(selectedApplicant?._id, 'rejected');
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1 }} />
          Reject
        </MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <Dialog open={profileDialog} onClose={() => setProfileDialog(false)} maxWidth="md" fullWidth>
        {selectedApplicant && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedApplicant.applicant?.profile?.avatar}
                  sx={{ width: 50, height: 50 }}
                >
                  {selectedApplicant.applicant?.firstName?.[0]}{selectedApplicant.applicant?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedApplicant.applicant?.firstName} {selectedApplicant.applicant?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedApplicant.applicant?.profile?.title}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                  <Typography variant="body2" gutterBottom>
                    <Email fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {selectedApplicant.applicant?.email}
                  </Typography>
                  {selectedApplicant.applicant?.profile?.phone && (
                    <Typography variant="body2" gutterBottom>
                      <Phone fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {selectedApplicant.applicant.profile.phone}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <LocationOn fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {selectedApplicant.applicant?.profile?.location || 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Experience & Education</Typography>
                  <Typography variant="body2" gutterBottom>
                    Experience: {selectedApplicant.applicant?.profile?.experience?.years || 0} years
                  </Typography>
                  {selectedApplicant.applicant?.profile?.education?.[0] && (
                    <Typography variant="body2">
                      Education: {selectedApplicant.applicant.profile.education[0].degree} in {selectedApplicant.applicant.profile.education[0].field}
                    </Typography>
                  )}
                </Grid>
                
                {selectedApplicant.applicant?.profile?.skills && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Skills</Typography>
                    <Box>
                      {selectedApplicant.applicant.profile.skills.map((skill, idx) => (
                        <Chip key={idx} label={skill} sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {selectedApplicant.coverLetter && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Cover Letter</Typography>
                    <Typography variant="body2">
                      {selectedApplicant.coverLetter}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProfileDialog(false)}>Close</Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/chat?user=${selectedApplicant.applicant._id}`)}
                startIcon={<Chat />}
              >
                Message
              </Button>
              <Button
                variant="contained"
                onClick={() => handleScheduleInterview(selectedApplicant)}
                startIcon={<Schedule />}
              >
                Schedule Interview
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Update status for {selectedApplicants.length} selected applications:
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {applicationStatuses.map(status => (
              <Grid item xs={6} key={status.value}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleBulkStatusUpdate(status.value)}
                  color={status.color}
                >
                  {status.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicantsPage;