import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Chip, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, FormControl, InputLabel,
  Select, MenuItem, Pagination, CircularProgress, Alert,
  Paper, Divider, Badge
} from '@mui/material';
import {
  Search, People, Email, Phone, LocationOn, Work,
  Star, Chat, Visibility, FilterList, Download,
  School, Business, CalendarToday
} from '@mui/icons-material';
import { employerService } from '../../services/employerService';
import { useNavigate } from 'react-router-dom';

const CandidateSearchPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [jobs, setJobs] = useState([]);
  
  const [searchFilters, setSearchFilters] = useState({
    skills: [],
    location: '',
    experience: '',
    education: '',
    keywords: ''
  });

  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'Leadership',
    'Communication', 'Problem Solving', 'Project Management', 'Machine Learning',
    'Data Analysis', 'UI/UX Design', 'Marketing', 'Sales'
  ];

  const experienceLevels = [
    { value: '0-1', label: '0-1 years' },
    { value: '2-3', label: '2-3 years' },
    { value: '4-6', label: '4-6 years' },
    { value: '7-10', label: '7-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const educationLevels = [
    'High School', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Professional Certification'
  ];

  useEffect(() => {
    loadJobs();
    searchCandidates();
  }, [page]);

  const loadJobs = async () => {
    try {
      const response = await employerService.getJobs({ status: 'active' });
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const searchCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const searchParams = {
        ...searchFilters,
        skills: searchFilters.skills.join(','),
        page,
        limit: 10
      };
      
      const response = await employerService.searchCandidates(searchParams);
      setCandidates(response.candidates || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      setError('Failed to search candidates');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(1);
    searchCandidates();
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleInviteCandidate = async (candidateId, jobId, message) => {
    try {
      await employerService.inviteCandidate(candidateId, jobId, message);
      setInviteDialog(false);
      setSelectedCandidate(null);
      // Show success message
    } catch (error) {
      console.error('Invite error:', error);
    }
  };

  const handleStartChat = (candidateId) => {
    navigate(`/chat?user=${candidateId}`);
  };

  const formatExperience = (experience) => {
    if (!experience) return 'Not specified';
    return `${experience.years || 0} years`;
  };

  const formatEducation = (education) => {
    if (!education || education.length === 0) return 'Not specified';
    const latest = education[0];
    return `${latest.degree} in ${latest.field}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Search Candidates
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Find and connect with qualified candidates
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            Search Filters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Keywords"
                value={searchFilters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                placeholder="Job title, company, or keywords"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={searchFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City, state, or country"
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={searchFilters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {experienceLevels.map(level => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Education</InputLabel>
                <Select
                  value={searchFilters.education}
                  onChange={(e) => handleFilterChange('education', e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {educationLevels.map(level => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={commonSkills}
                freeSolo
                value={searchFilters.skills}
                onChange={(e, newValue) => handleFilterChange('skills', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    placeholder="Add skills to search for"
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Search Results ({candidates.length} candidates found)
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {candidates.map((candidate, index) => (
                <React.Fragment key={candidate._id}>
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={candidate.profile?.avatar}
                        sx={{ width: 60, height: 60 }}
                      >
                        {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">
                            {candidate.firstName} {candidate.lastName}
                          </Typography>
                          {candidate.profile?.verified && (
                            <Badge color="primary" variant="dot" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {candidate.profile?.title || 'Professional'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="caption">
                                {candidate.profile?.location || 'Location not specified'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work fontSize="small" color="action" />
                              <Typography variant="caption">
                                {formatExperience(candidate.profile?.experience)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <School fontSize="small" color="action" />
                              <Typography variant="caption">
                                {formatEducation(candidate.profile?.education)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {candidate.profile?.skills && (
                            <Box sx={{ mt: 1 }}>
                              {candidate.profile.skills.slice(0, 5).map((skill, idx) => (
                                <Chip
                                  key={idx}
                                  label={skill}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {candidate.profile.skills.length > 5 && (
                                <Chip
                                  label={`+${candidate.profile.skills.length - 5} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewProfile(candidate)}
                        startIcon={<Visibility />}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStartChat(candidate._id)}
                        startIcon={<Chat />}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setInviteDialog(true);
                        }}
                        startIcon={<Email />}
                      >
                        Invite
                      </Button>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
              
              {candidates.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No candidates found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search filters
                  </Typography>
                </Box>
              )}
            </List>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Candidate Profile Dialog */}
      <Dialog
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedCandidate && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedCandidate.profile?.avatar}
                  sx={{ width: 50, height: 50 }}
                >
                  {selectedCandidate.firstName?.[0]}{selectedCandidate.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCandidate.profile?.title}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email fontSize="small" />
                    <Typography variant="body2">{selectedCandidate.email}</Typography>
                  </Box>
                  {selectedCandidate.profile?.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">{selectedCandidate.profile.phone}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">
                      {selectedCandidate.profile?.location || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Experience</Typography>
                  <Typography variant="body2">
                    {formatExperience(selectedCandidate.profile?.experience)}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Education</Typography>
                  <Typography variant="body2">
                    {formatEducation(selectedCandidate.profile?.education)}
                  </Typography>
                </Grid>
                
                {selectedCandidate.profile?.skills && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom><Trans>Skills</Trans></Typography>
                    <Box>
                      {selectedCandidate.profile.skills.map((skill, idx) => (
                        <Chip key={idx} label={skill} sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {selectedCandidate.profile?.summary && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom><Trans>Summary</Trans></Typography>
                    <Typography variant="body2">
                      {selectedCandidate.profile.summary}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCandidate(null)}><Trans>Close</Trans></Button>
              <Button
                variant="outlined"
                onClick={() => handleStartChat(selectedCandidate._id)}
                startIcon={<Chat />}
              >
                Message
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setInviteDialog(true);
                }}
                startIcon={<Email />}
              >
                Invite to Job
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Candidate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel><Trans>Select Job</Trans></InputLabel>
                <Select defaultValue="">
                  {jobs.map(job => (
                    <MenuItem key={job._id} value={job._id}>
                      {job.title} - {job.location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Personal Message"
                placeholder="Add a personal message to your invitation..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button variant="contained"><Trans>Send Invitation</Trans></Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateSearchPage;
