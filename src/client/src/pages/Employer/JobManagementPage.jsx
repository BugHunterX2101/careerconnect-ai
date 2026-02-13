import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Grid, Chip, List, ListItem, ListItemText, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Menu, MenuItem, Alert, CircularProgress, Tabs, Tab,
  Paper, Divider, Badge, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import {
  Work, Edit, Delete, Visibility, MoreVert, Add,
  People, Schedule, Pause, PlayArrow, Share,
  TrendingUp, LocationOn, AttachMoney, AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { employerService } from '../../services/employerService';
const JobManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await employerService.getJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      setError('Failed to load jobs');
      console.error('Load jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await employerService.toggleJobStatus(jobId, newStatus);
      setSuccess(`Job ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
      loadJobs();
    } catch (error) {
      setError('Failed to update job status');
    }
  };

  const handleDeleteJob = async () => {
    try {
      await employerService.deleteJob(selectedJob._id);
      setSuccess('Job deleted successfully');
      setDeleteDialog(false);
      setSelectedJob(null);
      loadJobs();
    } catch (error) {
      setError('Failed to delete job');
    }
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(job => job.status === status);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'closed': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const JobCard = ({ job }) => (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" component="h3">
                {job.title}
              </Typography>
              <Chip
                size="small"
                label={job.status}
                color={getStatusColor(job.status)}
              />
              {job.remote && (
                <Chip size="small" label="Remote" variant="outlined" />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {job.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatSalary(job.salary)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {job.type}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {job.description?.substring(0, 150)}...
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {job.requiredSkills?.slice(0, 3).map((skill, index) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
              {job.requiredSkills?.length > 3 && (
                <Chip 
                  label={`+${job.requiredSkills.length - 3} more`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <People fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {job.applications?.length || 0} applications
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Posted {formatDate(job.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedJob(job);
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => navigate(`/employer/jobs/${job._id}`)}
            >
              View Details
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<People />}
              onClick={() => navigate(`/employer/jobs/${job._id}/applications`)}
            >
              Applications ({job.applications?.length || 0})
            </Button>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={job.status === 'active'}
                onChange={() => handleToggleJobStatus(job._id, job.status)}
                size="small"
              />
            }
            label={job.status === 'active' ? 'Active' : 'Paused'}
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Job Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your job postings and applications
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/employer/jobs/post')}
          size="large"
        >
          Post New Job
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Job Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Work sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Jobs</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {jobs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlayArrow sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Active</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getJobsByStatus('active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Applications</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {jobs.reduce((total, job) => total + (job.applications?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Avg. Applications</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {jobs.length > 0 ? Math.round(jobs.reduce((total, job) => total + (job.applications?.length || 0), 0) / jobs.length) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Job Lists */}
      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All Jobs (${jobs.length})`} />
          <Tab label={`Active (${getJobsByStatus('active').length})`} />
          <Tab label={`Paused (${getJobsByStatus('paused').length})`} />
          <Tab label={`Closed (${getJobsByStatus('closed').length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {(tabValue === 0 ? jobs :
                tabValue === 1 ? getJobsByStatus('active') :
                tabValue === 2 ? getJobsByStatus('paused') :
                getJobsByStatus('closed'))
                .map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}

              {(tabValue === 0 ? jobs :
                tabValue === 1 ? getJobsByStatus('active') :
                tabValue === 2 ? getJobsByStatus('paused') :
                getJobsByStatus('closed')).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No jobs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'Start by posting your first job' : 
                     tabValue === 1 ? 'No active jobs at the moment' :
                     tabValue === 2 ? 'No paused jobs' :
                     'No closed jobs'}
                  </Typography>
                  {tabValue === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/employer/jobs/post')}
                      sx={{ mt: 2 }}
                    >
                      Post Your First Job
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Job Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          navigate(`/employer/jobs/${selectedJob?._id}`);
          setAnchorEl(null);
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/employer/jobs/${selectedJob?._id}/edit`);
          setAnchorEl(null);
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/employer/jobs/${selectedJob?._id}/applications`);
          setAnchorEl(null);
        }}>
          <People sx={{ mr: 1 }} />
          View Applications
        </MenuItem>
        <MenuItem onClick={() => {
          setShareDialog(true);
          setAnchorEl(null);
        }}>
          <Share sx={{ mr: 1 }} />
          Share Job
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleToggleJobStatus(selectedJob?._id, selectedJob?.status);
            setAnchorEl(null);
          }}
          sx={{ color: selectedJob?.status === 'active' ? 'warning.main' : 'success.main' }}
        >
          {selectedJob?.status === 'active' ? <Pause sx={{ mr: 1 }} /> : <PlayArrow sx={{ mr: 1 }} />}
          {selectedJob?.status === 'active' ? 'Pause Job' : 'Activate Job'}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialog(true);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteJob} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Job Dialog */}
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Job</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Share "{selectedJob?.title}" with others:
          </Typography>
          <TextField
            fullWidth
            label="Job URL"
            value={`${window.location.origin}/jobs/${selectedJob?._id}`}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/jobs/${selectedJob?._id}`);
              setSuccess('Job URL copied to clipboard!');
              setShareDialog(false);
            }}
          >
            Copy URL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobManagementPage;