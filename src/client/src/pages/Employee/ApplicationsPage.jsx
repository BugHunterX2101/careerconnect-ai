import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { Visibility, Delete, FilterList, ArrowBack } from '@mui/icons-material';
import { FixedSizeList } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await employeeService.getApplications();
      const apps = Array.isArray(data?.applications) ? data.applications : [];
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Could not load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.job?.title || app.jobTitle || '').toLowerCase().includes(term) ||
          (app.job?.company || app.company || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applications, statusFilter, debouncedSearchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'applied': return 'warning';
      case 'interview': return 'info';
      case 'scheduled': return 'info';
      case 'accepted': return 'success';
      case 'hired': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const handleViewDetails = useCallback((application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  }, []);

  const handleWithdrawApplication = useCallback(async (applicationId) => {
    try {
      await employeeService.withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((app) => (app.id || app._id) !== applicationId));
    } catch (err) {
      console.error('Error withdrawing application:', err);
    }
  }, []);

  const listHeight = useMemo(() => {
    if (filteredApplications.length === 0) return 0;
    return Math.min(620, filteredApplications.length * 76);
  }, [filteredApplications.length]);

  const ApplicationRow = useCallback(({ index, style }) => {
    const application = filteredApplications[index];
    if (!application) return null;

    const appId = application.id || application._id;
    const jobTitle = application.job?.title || application.jobTitle || 'Position';
    const company = application.job?.company || application.company || 'Company';
    const appliedDate = application.appliedAt
      ? new Date(application.appliedAt).toLocaleDateString()
      : (application.appliedDate || '-');
    const location = application.job?.location || application.location || '-';
    const status = application.status || 'applied';

    return (
      <ListItem style={style} divider sx={{ px: 2 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr 1fr 1fr 1fr auto', gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle2">{jobTitle}</Typography>
              <Typography>{company}</Typography>
              <Chip label={status} color={getStatusColor(status)} size="small" />
              <Typography>{appliedDate}</Typography>
              <Typography>{location}</Typography>
              <Box>
                <IconButton size="small" onClick={() => handleViewDetails(application)} sx={{ color: '#8B6F47' }}>
                  <Visibility />
                </IconButton>
                {['pending', 'applied'].includes(status) && (
                  <IconButton size="small" color="error" onClick={() => handleWithdrawApplication(appId)}>
                    <Delete />
                  </IconButton>
                )}
              </Box>
            </Box>
          }
        />
      </ListItem>
    );
  }, [filteredApplications, handleViewDetails, handleWithdrawApplication]);

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
          My Applications
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search applications"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="applied">Applied</MenuItem>
                <MenuItem value="interview">Interview</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
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
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)',
        border: '1px solid rgba(139, 111, 71, 0.15)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)'
      }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#8B6F47' }} />
          </Box>
        ) : filteredApplications.length > 0 ? (
          <Box sx={{ borderTop: '1px solid rgba(139, 111, 71, 0.08)' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1.7fr 1.3fr 1fr 1fr 1fr auto',
              gap: 1,
              px: 2,
              py: 1.5,
              backgroundColor: 'rgba(139, 111, 71, 0.08)',
              fontWeight: 600,
              color: '#6B5544',
              fontSize: '0.95rem'
            }}>
              <Box>Job Title</Box>
              <Box>Company</Box>
              <Box>Status</Box>
              <Box>Applied</Box>
              <Box>Location</Box>
              <Box>Actions</Box>
            </Box>
            <FixedSizeList
              height={listHeight}
              width="100%"
              itemCount={filteredApplications.length}
              itemSize={76}
            >
              {ApplicationRow}
            </FixedSizeList>
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>
              {applications.length === 0
                ? 'No applications yet. Start applying to jobs!'
                : 'No applications match your filters.'}
            </Typography>
            {applications.length === 0 && (
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                  textTransform: 'none'
                }}
                onClick={() => navigate('/jobs/search')}
              >
                Browse Jobs
              </Button>
            )}
          </Box>
        )}
      </Card>

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
        <DialogTitle sx={{ fontWeight: 700, color: '#6B5544', fontSize: '1.35rem' }}>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedApplication.job?.title || selectedApplication.jobTitle || 'Position'}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedApplication.job?.company || selectedApplication.company || 'Company'}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedApplication.status}
                    color={getStatusColor(selectedApplication.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Applied Date</Typography>
                  <Typography variant="body1">
                    {selectedApplication.appliedAt
                      ? new Date(selectedApplication.appliedAt).toLocaleDateString()
                      : (selectedApplication.appliedDate || '-')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Location</Typography>
                  <Typography variant="body1">
                    {selectedApplication.job?.location || selectedApplication.location || '-'}
                  </Typography>
                </Grid>
                {selectedApplication.interviewType && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Interview Type</Typography>
                    <Typography variant="body1">{selectedApplication.interviewType}</Typography>
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

export default ApplicationsPage;
