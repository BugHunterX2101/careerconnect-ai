import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Avatar, List,
  ListItem, ListItemAvatar, ListItemText, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, Badge,
  IconButton, Tooltip, Stepper, Step, StepLabel, Switch, FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  Work, LocationOn, AttachMoney, Schedule, Person, Email,
  Phone, VideoCall, Chat, Star, TrendingUp, CheckCircle,
  Add, Remove, Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import api from '../../services/api';


const JobPostingPage = () => {
  const { user } = useAuth();
  useSocket();
  const navigate = useNavigate();
  
  // Job posting form state
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    salary: { min: '', max: '' },
    company: user?.company || '',
    remote: false,
    experienceLevel: 'mid',
    skills: [],
    benefits: [],
    deadline: ''
  });
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchingCandidates, setMatchingCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);
  const [jobPosted, setJobPosted] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState(null);
  const [postedJobId, setPostedJobId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newBenefit, setNewBenefit] = useState('');

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const steps = ['Job Details', 'Requirements', 'Review & Post', 'Matching Candidates'];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setJobData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setJobData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobData.skills.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const postJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await jobService.postJob({ ...jobData, requirements: jobData.skills });
      const jobId = data.job?._id || data._id;
      setPostedJobId(jobId);
      setJobPosted(true);
      setMatchingCandidates(data.matchingCandidates || []);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error posting job:', error);
      setError(error.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const refreshCandidates = async () => {
    if (!jobPosted || !postedJobId) return;

    try {
      setLoading(true);
      const response = await api.get(`/employer/jobs/${postedJobId}/matching-candidates`);
      setMatchingCandidates(response.data.candidates || []);
    } catch (error) {
      console.error('Error refreshing candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !jobData.benefits.includes(newBenefit.trim())) {
      setJobData((prev) => ({ ...prev, benefits: [...prev.benefits, newBenefit.trim()] }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (b) =>
    setJobData((prev) => ({ ...prev, benefits: prev.benefits.filter((x) => x !== b) }));

  const scheduleInterview = async (candidateId) => {
    try {
      const interviewData = {
        jobId: postedJobId,
        candidateId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        type: 'video',
        notes: `Interview for ${jobData.title} position`
      };
      await jobService.scheduleInterview(interviewData);
      showSnackbar('Interview scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling interview:', error);
      showSnackbar('Failed to schedule interview', 'error');
    }
  };

  const startChat = (candidateId) => {
    navigate(`/chat?user=${candidateId}`);
  };

  const viewCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateDetailsOpen(true);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderJobDetailsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Job Title"
          value={jobData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Job Description"
          value={jobData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Location"
          value={jobData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company"
          value={jobData.company}
          onChange={(e) => handleInputChange('company', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Job Type</InputLabel>
          <Select
            value={jobData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <MenuItem value="full-time">Full Time</MenuItem>
            <MenuItem value="part-time">Part Time</MenuItem>
            <MenuItem value="contract">Contract</MenuItem>
            <MenuItem value="internship">Internship</MenuItem>
            <MenuItem value="temporary">Temporary</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Experience Level</InputLabel>
          <Select
            value={jobData.experienceLevel}
            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
          >
            <MenuItem value="entry">Entry Level</MenuItem>
            <MenuItem value="mid">Mid Level</MenuItem>
            <MenuItem value="senior">Senior Level</MenuItem>
            <MenuItem value="lead">Lead/Manager</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={jobData.remote}
              onChange={(e) => handleInputChange('remote', e.target.checked)}
              sx={{ '& .Mui-checked': { color: '#8B6F47' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#8B6F47' } }}
            />
          }
          label="Remote / Work from Home"
        />
      </Grid>
    </Grid>
  );

  const renderRequirementsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Required Skills</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {jobData.skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={() => removeSkill(skill)}
              sx={{ bgcolor: 'rgba(139, 111, 71, 0.12)', color: '#6B5544', '& .MuiChip-deleteIcon': { color: '#8B6F47' } }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Add Skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          />
          <Button onClick={addSkill} startIcon={<Add />}>
            Add
          </Button>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Minimum Salary"
          type="number"
          value={jobData.salary.min}
          onChange={(e) => handleInputChange('salary.min', e.target.value)}
          InputProps={{
            startAdornment: <AttachMoney />
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Maximum Salary"
          type="number"
          value={jobData.salary.max}
          onChange={(e) => handleInputChange('salary.max', e.target.value)}
          InputProps={{
            startAdornment: <AttachMoney />
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Application Deadline"
          type="date"
          value={jobData.deadline}
          onChange={(e) => handleInputChange('deadline', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Benefits</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {jobData.benefits.map((benefit, index) => (
            <Chip key={index} label={benefit} onDelete={() => removeBenefit(benefit)} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Add Benefit"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
            placeholder="e.g. Health insurance, 401k, Remote work"
          />
          <Button onClick={addBenefit} startIcon={<Add />}>Add</Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderReviewStep = () => (
    <Card sx={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(139, 111, 71, 0.2)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{jobData.title}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {jobData.company} • {jobData.location} • {jobData.type}
        </Typography>
        <Typography variant="body1" paragraph>
          {jobData.description}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Required Skills:</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {jobData.skills.map((skill, index) => (
              <Chip key={index} label={skill} size="small" />
            ))}
          </Box>
        </Box>
        <Typography variant="body2">
          Salary: ${jobData.salary.min} - ${jobData.salary.max}
        </Typography>
        <Typography variant="body2">
          Experience Level: {jobData.experienceLevel}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderMatchingCandidatesStep = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Matching Candidates ({matchingCandidates.length})
        </Typography>
        <Button
          onClick={refreshCandidates}
          startIcon={<Refresh />}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {matchingCandidates.length === 0 ? (
        <Alert severity="info">
          No matching candidates found yet. Candidates will appear here as they match your job requirements.
        </Alert>
      ) : (
        <List>
          {matchingCandidates.map((candidate, index) => (
            <React.Fragment key={candidate._id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {candidate.firstName} {candidate.lastName}
                      </Typography>
                      <Chip
                        label={`${candidate.matchScore}% Match`}
                        color={getMatchScoreColor(candidate.matchScore)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.profile?.title || 'Professional'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.profile?.location || 'Location not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.profile?.experience?.years || 0} years experience
                      </Typography>
                      {candidate.matchReasons && (
                        <Box sx={{ mt: 1 }}>
                          {candidate.matchReasons.slice(0, 2).map((reason, idx) => (
                            <Chip
                              key={idx}
                              label={reason.message}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Profile">
                    <IconButton onClick={() => viewCandidateDetails(candidate)}>
                      <Person />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Schedule Interview">
                    <IconButton 
                      onClick={() => scheduleInterview(candidate._id)}
                      color="primary"
                    >
                      <VideoCall />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Start Chat">
                    <IconButton onClick={() => startChat(candidate._id)}>
                      <Chat />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
              {index < matchingCandidates.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  const btnSx = {
    background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
    textTransform: 'none',
    '&:hover': { background: 'linear-gradient(135deg, #7A6040 0%, #5A4535 100%)' },
    '&.Mui-disabled': { opacity: 0.6 }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#6B5544' }}>
        Post New Job
      </Typography>

      <Stepper activeStep={currentStep} sx={{
        mb: 4,
        '& .MuiStepIcon-root.Mui-active': { color: '#8B6F47' },
        '& .MuiStepIcon-root.Mui-completed': { color: '#6B5544' },
        '& .MuiStepLabel-label.Mui-active': { color: '#6B5544', fontWeight: 700 },
        '& .MuiStepConnector-line': { borderColor: 'rgba(139, 111, 71, 0.3)' }
      }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 100%)', border: '1px solid rgba(139, 111, 71, 0.15)', borderRadius: 2, boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)' }}>
        {currentStep === 0 && renderJobDetailsStep()}
        {currentStep === 1 && renderRequirementsStep()}
        {currentStep === 2 && renderReviewStep()}
        {currentStep === 3 && renderMatchingCandidatesStep()}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
          sx={{ color: '#8B6F47', textTransform: 'none' }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentStep < 2 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (currentStep === 0 && (!jobData.title || !jobData.description)) ||
                (currentStep === 1 && jobData.skills.length === 0)
              }
              sx={btnSx}
            >
              Next
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              variant="contained"
              onClick={postJob}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Work />}
              sx={btnSx}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              variant="contained"
              onClick={() => navigate('/employer/jobs')}
              startIcon={<CheckCircle />}
              sx={btnSx}
            >
              Done
            </Button>
          )}
        </Box>
      </Box>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Candidate Details Dialog */}
      <Dialog
        open={candidateDetailsOpen}
        onClose={() => setCandidateDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Candidate Profile
        </DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                  {selectedCandidate.firstName?.[0]}{selectedCandidate.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCandidate.profile?.title || 'Professional'}
                  </Typography>
                  <Chip
                    label={`${selectedCandidate.matchScore}% Match`}
                    color={getMatchScoreColor(selectedCandidate.matchScore)}
                    size="small"
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Contact</Typography>
                  <Typography variant="body2">{selectedCandidate.email}</Typography>
                  <Typography variant="body2">{selectedCandidate.profile?.location}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Experience</Typography>
                  <Typography variant="body2">
                    {selectedCandidate.profile?.experience?.years || 0} years
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCandidate.profile?.skills?.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                  <Typography variant="body2">
                    {selectedCandidate.profile?.summary || 'No summary available'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCandidateDetailsOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              scheduleInterview(selectedCandidate._id);
              setCandidateDetailsOpen(false);
            }}
            startIcon={<VideoCall />}
          >
            Schedule Interview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobPostingPage;
