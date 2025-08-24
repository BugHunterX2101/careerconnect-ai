import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  Avatar,
  Rating,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Work,
  LocationOn,
  Business,
  TrendingUp,
  FilterList,
  Search,
  Bookmark,
  BookmarkBorder,
  Share,
  Send,
  MonetizationOn,
  Schedule,
  Star,
  StarBorder
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const JobRecommendationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    salary: [50000, 150000],
    skills: [],
    remote: false
  });
  const [sortBy, setSortBy] = useState('match');

  useEffect(() => {
    // Simulate loading jobs
    setTimeout(() => {
      setJobs([
        {
          id: 1,
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          remote: true,
          salary: '$120k - $150k',
          experience: '5+ years',
          match: 95,
          skills: ['React', 'Node.js', 'Python', 'AWS'],
          description: 'We are looking for a senior software engineer to join our growing team...',
          posted: '2 days ago',
          applications: 45,
          saved: false
        },
        {
          id: 2,
          title: 'Full Stack Developer',
          company: 'Startup Inc',
          location: 'Remote',
          remote: true,
          salary: '$100k - $130k',
          experience: '3+ years',
          match: 88,
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
          description: 'Join our fast-growing startup and help build amazing products...',
          posted: '1 week ago',
          applications: 32,
          saved: true
        },
        {
          id: 3,
          title: 'Frontend Engineer',
          company: 'Big Tech',
          location: 'New York, NY',
          remote: false,
          salary: '$110k - $140k',
          experience: '4+ years',
          match: 82,
          skills: ['React', 'TypeScript', 'CSS', 'GraphQL'],
          description: 'Build beautiful and performant user interfaces for millions of users...',
          posted: '3 days ago',
          applications: 67,
          saved: false
        },
        {
          id: 4,
          title: 'Backend Developer',
          company: 'FinTech Solutions',
          location: 'Austin, TX',
          remote: true,
          salary: '$90k - $120k',
          experience: '3+ years',
          match: 78,
          skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
          description: 'Develop robust backend systems for financial applications...',
          posted: '5 days ago',
          applications: 28,
          saved: false
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSaveJob = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const handleApply = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const getMatchColor = (match) => {
    if (match >= 90) return 'success';
    if (match >= 80) return 'warning';
    return 'error';
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        return b.match - a.match;
      case 'salary':
        return parseInt(b.salary.split('$')[1]) - parseInt(a.salary.split('$')[1]);
      case 'recent':
        return new Date(b.posted) - new Date(a.posted);
      default:
        return 0;
    }
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Job Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered job matches based on your resume and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters
              </Typography>

              {/* Location */}
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Experience Level */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={filters.experience}
                  label="Experience Level"
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="entry">Entry Level (0-2 years)</MenuItem>
                  <MenuItem value="mid">Mid Level (3-5 years)</MenuItem>
                  <MenuItem value="senior">Senior Level (5+ years)</MenuItem>
                </Select>
              </FormControl>

              {/* Salary Range */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Salary Range
                </Typography>
                <Slider
                  value={filters.salary}
                  onChange={(e, newValue) => setFilters({ ...filters, salary: newValue })}
                  valueLabelDisplay="auto"
                  min={30000}
                  max={200000}
                  step={10000}
                  valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">
                    ${filters.salary[0].toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    ${filters.salary[1].toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Sort By */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="match">Match Score</MenuItem>
                  <MenuItem value="salary">Salary</MenuItem>
                  <MenuItem value="recent">Recently Posted</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setFilters({
                  location: '',
                  experience: '',
                  salary: [50000, 150000],
                  skills: [],
                  remote: false
                })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Listings */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading recommendations...</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {sortedJobs.length} Recommended Jobs
                </Typography>
                <Chip
                  label={`${sortedJobs.filter(job => job.match >= 90).length} High Match`}
                  color="success"
                  variant="outlined"
                />
              </Box>

              {sortedJobs.map((job) => (
                <Card key={job.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                            {job.title}
                          </Typography>
                          <Chip
                            label={`${job.match}% match`}
                            color={getMatchColor(job.match)}
                            size="small"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Business sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            {job.company}
                          </Typography>
                          <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            {job.location}
                          </Typography>
                          {job.remote && (
                            <Chip label="Remote" size="small" color="primary" variant="outlined" />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <MonetizationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mr: 2 }}>
                            {job.salary}
                          </Typography>
                          <Schedule sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.experience}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {job.description}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {job.skills.map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            Posted {job.posted} • {job.applications} applications
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        <IconButton
                          onClick={() => handleSaveJob(job.id)}
                          color={job.saved ? 'primary' : 'default'}
                        >
                          {job.saved ? <Bookmark /> : <BookmarkBorder />}
                        </IconButton>
                        <IconButton>
                          <Share />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => handleApply(job.id)}
                        sx={{ flex: 1 }}
                      >
                        Apply Now
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        sx={{ flex: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobRecommendationsPage;
