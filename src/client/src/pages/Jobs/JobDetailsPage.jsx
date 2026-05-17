import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Chip, Grid, Divider, CircularProgress, Alert, Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Work, LocationOn, Business, Send, ArrowBack,
  AttachMoney, AccessTime, CalendarToday, CheckCircle
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/jobs/${id}`);
        const data = res.data?.data || res.data?.job || res.data;
        setJob(data);
      } catch (err) {
        setError('Could not load job details. It may have been removed.');
        console.error('Job details error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      await api.post(`/jobs/apply/${id}`, {});
      setApplied(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to apply. Please try again.');
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return null;
    if (typeof salary === 'string') return salary;
    const { min, max, currency = 'USD' } = salary;
    if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return null;
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    return [location.city, location.state, location.country].filter(Boolean).join(', ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Job Details
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {applied && <Alert severity="success" sx={{ mb: 3 }}>Application submitted successfully!</Alert>}

      {!job && !loading ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">Job not found or has been removed.</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/jobs/search')}>Browse Jobs</Button>
          </CardContent>
        </Card>
      ) : job && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    <Business />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {job.title}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {job.company || job.employer?.company || 'Company'}
                    </Typography>
                  </Box>
                  <Chip
                    label={job.status || 'active'}
                    color={job.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="body2">{formatLocation(job.location)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work color="action" fontSize="small" />
                      <Typography variant="body2">{job.type || 'Full-time'}</Typography>
                    </Box>
                  </Grid>
                  {formatSalary(job.salary) && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney color="action" fontSize="small" />
                        <Typography variant="body2">{formatSalary(job.salary)}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {job.createdAt && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday color="action" fontSize="small" />
                        <Typography variant="body2">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" gutterBottom>Job Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
                  {job.description || 'No description provided.'}
                </Typography>

                {job.requirements?.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Requirements</Typography>
                    <Box sx={{ mb: 3 }}>
                      {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <CheckCircle fontSize="small" color="success" sx={{ mt: 0.3 }} />
                          <Typography variant="body2">{req}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                {(job.requiredSkills || job.skills)?.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Skills</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(job.requiredSkills || job.skills).map((skill, i) => (
                        <Chip key={i} label={skill} variant="outlined" size="small" />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 16 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Apply for this Job</Typography>
                {user?.role === 'jobseeker' || user?.role !== 'employer' ? (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={applied ? <CheckCircle /> : <Send />}
                    onClick={handleApply}
                    disabled={applied || applying}
                    sx={{ mb: 2 }}
                  >
                    {applying ? 'Applying...' : applied ? 'Applied!' : 'Apply Now'}
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(-1)}
                >
                  Back to Jobs
                </Button>

                {job.applicationDeadline && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.dark">
                      Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default JobDetailsPage;
