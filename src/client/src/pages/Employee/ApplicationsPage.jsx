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
  ListItemText
} from '@mui/material';
import { Visibility, Delete, FilterList } from '@mui/icons-material';
import { FixedSizeList } from 'react-window';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const ApplicationsPage = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const requestAbortRef = useRef(null);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
      const abortController = new AbortController();
      requestAbortRef.current = abortController;

      await api.get('/jobs/applications', { signal: abortController.signal });
      const mockApplications = [
        {
          id: 1,
          jobTitle: 'Frontend Developer',
          company: 'Tech Corp',
          status: 'pending',
          appliedDate: '2024-01-15',
          salary: '$80,000',
          location: 'New York',
          description: 'Exciting opportunity to work with React and modern web technologies.'
        },
        {
          id: 2,
          jobTitle: 'React Developer',
          company: 'StartupXYZ',
          status: 'interview',
          appliedDate: '2024-01-10',
          salary: '$90,000',
          location: 'Remote',
          description: 'Join our growing team building innovative web applications.'
        },
        {
          id: 3,
          jobTitle: 'Full Stack Engineer',
          company: 'BigTech Inc',
          status: 'rejected',
          appliedDate: '2024-01-05',
          salary: '$120,000',
          location: 'San Francisco',
          description: 'Work on large-scale applications with millions of users.'
        }
      ];
      setApplications(mockApplications);
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error fetching applications:', error);
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
        (app) => app.jobTitle.toLowerCase().includes(term) || app.company.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applications, statusFilter, debouncedSearchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'interview': return 'info';
      case 'accepted': return 'success';
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
      await api.delete(`/jobs/applications/${applicationId}`);
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  }, []);

  const listHeight = useMemo(() => {
    if (filteredApplications.length === 0) return 0;
    return Math.min(620, filteredApplications.length * 76);
  }, [filteredApplications.length]);

  const ApplicationRow = useCallback(({ index, style }) => {
    const application = filteredApplications[index];
    if (!application) return null;

    return (
      <ListItem style={style} divider sx={{ px: 2 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr 1fr 1fr 1fr 1fr auto', gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle2">{application.jobTitle}</Typography>
              <Typography>{application.company}</Typography>
              <Chip label={application.status} color={getStatusColor(application.status)} size="small" />
              <Typography>{application.appliedDate}</Typography>
              <Typography>{application.salary}</Typography>
              <Typography>{application.location}</Typography>
              <Box>
                <IconButton size="small" onClick={() => handleViewDetails(application)} sx={{ color: '#8B6F47' }}>
                  <Visibility />
                </IconButton>
                {application.status === 'pending' && (
                  <IconButton size="small" color="error" onClick={() => handleWithdrawApplication(application.id)}>
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
      <Typography variant="h3" gutterBottom sx={{ 
        fontWeight: 700, 
        fontSize: '2rem', 
        color: '#6B5544',
        letterSpacing: '-0.5px',
        mb: 3
      }}>
        My Applications
      </Typography>

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
                label={t('applications.searchLabel')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label={t('filter.status')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">{t('filter.allStatus')}</MenuItem>
                <MenuItem value="pending">{t('filter.pending')}</MenuItem>
                <MenuItem value="interview">{t('filter.interview')}</MenuItem>
                <MenuItem value="accepted">{t('filter.accepted')}</MenuItem>
                <MenuItem value="rejected">{t('filter.rejected')}</MenuItem>
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
        {filteredApplications.length > 0 ? (
          <Box sx={{ borderTop: '1px solid rgba(139, 111, 71, 0.08)' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1.7fr 1.3fr 1fr 1fr 1fr 1fr auto',
              gap: 1,
              px: 2,
              py: 1.5,
              backgroundColor: 'rgba(139, 111, 71, 0.08)',
              fontWeight: 600,
              color: '#6B5544',
              fontSize: '0.95rem'
            }}>
              <Box>{t('table.jobTitle')}</Box>
              <Box>{t('table.company')}</Box>
              <Box>{t('table.status')}</Box>
              <Box>{t('table.appliedDate')}</Box>
              <Box>{t('table.salary')}</Box>
              <Box>{t('table.location')}</Box>
              <Box>{t('table.actions')}</Box>
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
            <Typography>No applications match your filters.</Typography>
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
                {selectedApplication.jobTitle}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedApplication.company}
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
                  <Typography variant="body1">{selectedApplication.appliedDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Salary</Typography>
                  <Typography variant="body1">{selectedApplication.salary}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Location</Typography>
                  <Typography variant="body1">{selectedApplication.location}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedApplication.description}</Typography>
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

export default ApplicationsPage;
