import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Avatar, List,
  ListItem, ListItemAvatar, ListItemText, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, Badge,
  IconButton, Tooltip, Stepper, Step, StepLabel
} from '@mui/material';
import {
  Work, LocationOn, AttachMoney, Schedule, Person, Email,
  Phone, VideoCall, Chat, Star, TrendingUp, CheckCircle,
  Add, Remove, Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const JobPostingPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
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

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...jobData,
          requirements: jobData.skills
        })
      });

      if (response.ok) {
        const data = await response.json();
        setJobPosted(true);
        setMatchingCandidates(data.matchingCandidates || []);
        setCurrentStep(3); // Move to matching candidates step
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const refreshCandidates = async () => {
    if (!jobPosted) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/employer/jobs/${jobData._id}/matching-candidates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatchingCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error('Error refreshing candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async (candidateId) => {
    try {
      const token = localStorage.getItem('token');
      const interviewData = {
        jobId: jobData._id,
        candidateId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 60,
        type: 'video',
        notes: `Interview for ${jobData.title} position`
      };

      const response = await fetch('http://localhost:3000/api/video/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(interviewData)
      });

      if (response.ok) {
        alert('Interview scheduled successfully!');
      } else {
        alert('Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview');
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
              color="primary"
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
    </Grid>
  );

  const renderReviewStep = () => (
    <Card>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Post New Job
      </Typography>

      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
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

      <Paper sx={{ p: 3, mb: 3 }}>
        {currentStep === 0 && renderJobDetailsStep()}
        {currentStep === 1 && renderRequirementsStep()}
        {currentStep === 2 && renderReviewStep()}
        {currentStep === 3 && renderMatchingCandidatesStep()}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
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
            >
              Next
            </Button>
          )}
          
          {currentStep === 2 && (
            <Button
              variant="contained"
              onClick={postJob}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Work />}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button
              variant="contained"
              onClick={() => navigate('/employer/jobs')}
              startIcon={<CheckCircle />}
            >
              Done
            </Button>
          )}
        </Box>
      </Box>

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