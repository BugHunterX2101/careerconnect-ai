import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Visibility, Delete, FilterList } from '@mui/icons-material';
import api from '../../services/api';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/jobs/applications');
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
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'interview': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const handleWithdrawApplication = async (applicationId) => {
    try {
      await api.delete(`/jobs/applications/${applicationId}`);
      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ 
        fontWeight: 700, 
        fontSize: '2.5rem', 
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(139, 111, 71, 0.08)' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.jobTitle')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.company')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.appliedDate')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.salary')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.location')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B5544', fontSize: '1.05rem' }}>{t('table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow 
                  key={application.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(139, 111, 71, 0.05)'
                    },
                    transition: 'background-color 0.2s ease',
                    '& .MuiTableCell-root': {
                      fontSize: '1rem'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="subtitle2">
                      {application.jobTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>{application.company}</TableCell>
                  <TableCell>
                    <Chip
                      label={application.status}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{application.appliedDate}</TableCell>
                  <TableCell>{application.salary}</TableCell>
                  <TableCell>{application.location}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(application)}
                      sx={{ 
                        color: '#8B6F47',
                        '&:hover': { backgroundColor: 'rgba(139, 111, 71, 0.1)' }
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    {application.status === 'pending' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleWithdrawApplication(application.id)}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
        <DialogTitle sx={{ fontWeight: 700, color: '#6B5544', fontSize: '1.75rem' }}>Application Details</DialogTitle>
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