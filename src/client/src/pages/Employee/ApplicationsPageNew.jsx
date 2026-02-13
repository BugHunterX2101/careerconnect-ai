import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Tabs, Tab,
  Paper, Divider, Tooltip, Menu, MenuItem
} from '@mui/material';
import {
  Work, Business, LocationOn, CalendarToday, MoreVert,
  Visibility, Delete, Chat, Schedule, CheckCircle,
  Cancel, AccessTime, TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';

const ApplicationsPageNew = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const applicationStatuses = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'reviewed', label: 'Reviewed', color: 'info' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'primary' },
    { value: 'interview', label: 'Interview', color: 'secondary' },
    { value: 'hired', label: 'Hired', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' }
  ];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getApplications();
      setApplications(response.applications || []);
    } catch (error) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawApplication = async () => {
    try {
      await employeeService.withdrawApplication(selectedApplication._id);
      setSuccess('Application withdrawn successfully');
      setWithdrawDialog(false);
      setSelectedApplication(null);
      loadApplications();
    } catch (error) {
      setError('Failed to withdraw application');
    }
  };

  const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
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

  const ApplicationCard = ({ application }) => (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {application.job?.title}
              </Typography>
              <Chip
                size="small"
                label={application.status}
                color={getStatusColor(application.status)}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {application.job?.company}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {application.job?.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Applied {formatDate(application.appliedAt)}
                </Typography>
              </Box>
            </Box>
            
            {application.coverLetter && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Cover Letter:</strong> {application.coverLetter.substring(0, 100)}...
              </Typography>
            )}
            
            {application.notes && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <strong>Employer Notes:</strong> {application.notes}
              </Alert>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title="View Job Details">
              <IconButton
                size="small"
                onClick={() => navigate(`/jobs/${application.job._id}`)}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Message Employer">
              <IconButton
                size="small"
                onClick={() => navigate(`/chat?user=${application.job.employer}`)}
              >
                <Chat />
              </IconButton>
            </Tooltip>
            
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedApplication(application);
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Applications
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('applications.trackStatus', 'Track your job applications and their status')}
      </Typography>
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Application Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {applicationStatuses.map(status => (
          <Grid item xs={12} sm={6} md={2} key={status.value}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${status.color}.main` }}>
                  {getApplicationsByStatus(status.value).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Application Lists */}
      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${applications.length})`} />
          <Tab label={`Pending (${getApplicationsByStatus('pending').length})`} />
          <Tab label={`In Progress (${getApplicationsByStatus('interview').length + getApplicationsByStatus('shortlisted').length})`} />
          <Tab label={`Completed (${getApplicationsByStatus('hired').length + getApplicationsByStatus('rejected').length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {(tabValue === 0 ? applications :
                tabValue === 1 ? getApplicationsByStatus('pending') :
                tabValue === 2 ? [...getApplicationsByStatus('interview'), ...getApplicationsByStatus('shortlisted')] :
                [...getApplicationsByStatus('hired'), ...getApplicationsByStatus('rejected')])
                .map((application) => (
                  <ApplicationCard key={application._id} application={application} />
                ))}

              {(tabValue === 0 ? applications :
                tabValue === 1 ? getApplicationsByStatus('pending') :
                tabValue === 2 ? [...getApplicationsByStatus('interview'), ...getApplicationsByStatus('shortlisted')] :
                [...getApplicationsByStatus('hired'), ...getApplicationsByStatus('rejected')]).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No applications found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'Start applying to jobs to see them here' : 
                     tabValue === 1 ? 'No pending applications' :
                     tabValue === 2 ? 'No applications in progress' :
                     'No completed applications'}
                  </Typography>
                  {tabValue === 0 && (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/jobs/search')}
                      sx={{ mt: 2 }}
                    >
                      Search Jobs
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Application Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          navigate(`/jobs/${selectedApplication?.job._id}`);
          setAnchorEl(null);
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Job Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/chat?user=${selectedApplication?.job.employer}`);
          setAnchorEl(null);
        }}>
          <Chat sx={{ mr: 1 }} />
          Message Employer
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            setWithdrawDialog(true);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
          disabled={['hired', 'rejected'].includes(selectedApplication?.status)}
        >
          <Cancel sx={{ mr: 1 }} />
          Withdraw Application
        </MenuItem>
      </Menu>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)}>
        <DialogTitle>Withdraw Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to withdraw your application for "{selectedApplication?.job?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)}>Cancel</Button>
          <Button onClick={handleWithdrawApplication} color="error" variant="contained">
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsPageNew;