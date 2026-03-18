import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Badge,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Work,
  AttachMoney,
  Schedule,
  Bookmark,
  BookmarkBorder,
  Launch,
  ExpandMore,
  Star,
  Business,
  TrendingUp,
  Refresh,
  SmartToy,
  CheckBox
} from '@mui/icons-material';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

const MotionBox = motion(Box);

const JobSearchPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryRange, setSalaryRange] = useState([0, 200000]);
  const [remote, setRemote] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [linkedinJobs, setLinkedinJobs] = useState([]);
  const [gptJobs, setGptJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [searchInsights, setSearchInsights] = useState(null);
  const [gptSearching, setGptSearching] = useState(false);
  const [linkedinSearching, setLinkedinSearching] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRecommendedJobs();
  }, []);

  const fetchRecommendedJobs = async () => {
    setLoading(true);
    try {
      // Generate mock recommended jobs based on user's resume
      const mockRecommendedJobs = generateMockRecommendedJobs();
      setRecommendedJobs(mockRecommendedJobs);
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Search internal jobs
      const internalResults = await searchInternalJobs();
      setJobs(internalResults);
      
      // Search LinkedIn jobs in parallel
      searchLinkedInJobs();
      
      // Get GPT-powered job suggestions
      searchWithGPT();
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchInternalJobs = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      q: searchQuery,
      location,
      type: jobType,
      remote: remote.toString(),
      salary_min: salaryRange[0],
      salary_max: salaryRange[1],
      experience_level: experienceLevel
    });
    
    const response = await fetch(`http://localhost:3000/api/jobs/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Search failed:', response.status, response.statusText);
      throw new Error(`Search failed with status: ${response.status}`);
    }
    try {
      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw new Error('Failed to parse search results');
    }
  };

  const searchLinkedInJobs = async () => {
    try {
      setLinkedinSearching(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/jobs/linkedin/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: searchQuery,
          location,
          jobType,
          remote,
          experienceLevel,
          limit: 20
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLinkedinJobs(data.jobs || []);
      } else {
        // Fallback to mock LinkedIn-style jobs
        setLinkedinJobs(generateLinkedInMockJobs());
      }
    } catch (error) {
      console.error('LinkedIn search error:', error);
      setLinkedinJobs(generateLinkedInMockJobs());
    } finally {
      setLinkedinSearching(false);
    }
  };

  const searchWithGPT = async () => {
    try {
      setGptSearching(true);
      const token = localStorage.getItem('token');
      
      const searchContext = {
        query: searchQuery,
        location,
        preferences: {
          jobType,
          remote,
          experienceLevel,
          salaryRange
        },
        userSkills: [], // Would come from user profile
        careerGoals: 'Find challenging opportunities in tech'
      };
      
      const response = await fetch('http://localhost:3000/api/ml/gpt-job-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchContext,
          generateInsights: true,
          includeCareerAdvice: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGptJobs(data.jobs || []);
        setSearchInsights(data.insights);
      } else {
        // Fallback to enhanced mock data
        setGptJobs(generateGPTEnhancedJobs());
        setSearchInsights(generateSearchInsights());
      }
    } catch (error) {
      console.error('GPT search error:', error);
      setGptJobs(generateGPTEnhancedJobs());
      setSearchInsights(generateSearchInsights());
    } finally {
      setGptSearching(false);
    }
  };

  const generateMockRecommendedJobs = () => [
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      type: 'Full-time',
      remote: true,
      matchScore: 95,
      description: 'We are looking for a Senior React Developer to join our team...',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      posted: '2 days ago',
      applicants: 45,
      isExternal: false,
      externalUrl: null
    },
    {
      id: 2,
      title: 'Full Stack JavaScript Developer',
      company: 'Google',
      location: 'Mountain View, CA',
      salary: '$140,000 - $180,000',
      type: 'Full-time',
      remote: false,
      matchScore: 88,
      description: 'Join Google as a Full Stack Developer working on cutting-edge projects...',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'GCP'],
      posted: '1 day ago',
      applicants: 120,
      isExternal: true,
      externalUrl: 'https://careers.google.com/jobs/results/123456789/'
    },
    {
      id: 3,
      title: 'Frontend Engineer',
      company: 'Microsoft',
      location: 'Seattle, WA',
      salary: '$130,000 - $160,000',
      type: 'Full-time',
      remote: true,
      matchScore: 82,
      description: 'Microsoft is seeking a Frontend Engineer for our Azure team...',
      skills: ['React', 'TypeScript', 'Azure', 'JavaScript'],
      posted: '3 days ago',
      applicants: 78,
      isExternal: true,
      externalUrl: 'https://careers.microsoft.com/us/en/job/1234567/'
    }
  ];

  const generateMockSearchResults = () => [
    {
      id: 4,
      title: 'Software Engineer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      salary: '$90,000 - $120,000',
      type: 'Full-time',
      remote: true,
      matchScore: 75,
      description: 'Join our fast-growing startup as a Software Engineer...',
      skills: ['JavaScript', 'React', 'Node.js'],
      posted: '1 week ago',
      applicants: 25,
      isExternal: false,
      source: 'Internal'
    }
  ];

  const generateLinkedInMockJobs = () => [
    {
      id: 'li_1',
      title: 'Senior Full Stack Developer',
      company: 'LinkedIn Corp',
      location: 'San Francisco, CA',
      salary: '$140,000 - $180,000',
      type: 'Full-time',
      remote: false,
      matchScore: 92,
      description: 'Join LinkedIn\'s engineering team to build the future of professional networking...',
      skills: ['React', 'Node.js', 'TypeScript', 'GraphQL'],
      posted: '2 days ago',
      applicants: 156,
      isExternal: true,
      source: 'LinkedIn',
      url: 'https://linkedin.com/jobs/view/123456789',
      companyLogo: 'https://logo.clearbit.com/linkedin.com'
    },
    {
      id: 'li_2',
      title: 'Frontend Engineer',
      company: 'Airbnb',
      location: 'Remote',
      salary: '$130,000 - $170,000',
      type: 'Full-time',
      remote: true,
      matchScore: 88,
      description: 'Help us create magical travel experiences through beautiful, intuitive interfaces...',
      skills: ['React', 'JavaScript', 'CSS', 'Design Systems'],
      posted: '1 day ago',
      applicants: 203,
      isExternal: true,
      source: 'LinkedIn',
      url: 'https://linkedin.com/jobs/view/987654321',
      companyLogo: 'https://logo.clearbit.com/airbnb.com'
    }
  ];

  const generateGPTEnhancedJobs = () => [
    {
      id: 'gpt_1',
      title: 'AI-Enhanced Full Stack Developer',
      company: 'TechForward AI',
      location: 'Remote',
      salary: '$120,000 - $160,000',
      type: 'Full-time',
      remote: true,
      matchScore: 95,
      description: 'Revolutionary role combining traditional full-stack development with AI integration. Perfect match for your React and Node.js skills with growth into AI/ML.',
      skills: ['React', 'Node.js', 'Python', 'TensorFlow', 'AI/ML'],
      posted: 'Just posted',
      applicants: 12,
      isExternal: false,
      source: 'GPT Enhanced',
      gptReasoning: 'This role perfectly matches your current skills while offering growth into the high-demand AI field. The company culture emphasizes learning and innovation.',
      careerGrowth: 'Senior AI Engineer → AI Team Lead → CTO',
      learningOpportunities: ['AI/ML Bootcamp', 'Conference Sponsorship', 'Mentorship Program']
    },
    {
      id: 'gpt_2',
      title: 'Senior React Developer - FinTech',
      company: 'NextGen Finance',
      location: 'New York, NY',
      salary: '$135,000 - $175,000',
      type: 'Full-time',
      remote: false,
      matchScore: 91,
      description: 'Lead React development for cutting-edge financial applications. High-impact role with equity upside and excellent benefits.',
      skills: ['React', 'TypeScript', 'GraphQL', 'Microservices'],
      posted: '3 hours ago',
      applicants: 8,
      isExternal: false,
      source: 'GPT Enhanced',
      gptReasoning: 'FinTech offers 25% higher salaries on average. Your React expertise is exactly what they need for their platform rebuild.',
      careerGrowth: 'Tech Lead → Engineering Manager → VP Engineering',
      learningOpportunities: ['Financial Systems Training', 'Leadership Development', 'Stock Options']
    }
  ];

  const generateSearchInsights = () => ({
    searchQuality: {
      score: 87,
      feedback: 'Great search terms! Your query targets high-demand skills in growing markets.'
    },
    marketAnalysis: {
      demandLevel: 'Very High',
      competitionLevel: 'Moderate',
      salaryTrend: '+12% YoY',
      hotKeywords: ['React', 'TypeScript', 'Remote', 'Full-stack']
    },
    recommendations: [
      'Consider adding "TypeScript" to your search for 15% more opportunities',
      'Remote positions in your field offer 8% salary premium',
      'FinTech and HealthTech sectors show highest growth for your skills'
    ],
    alternativeSearches: [
      'Frontend Engineer + React',
      'Full Stack Developer + TypeScript',
      'React Developer + Remote'
    ],
    careerAdvice: {
      nextSkills: ['TypeScript', 'GraphQL', 'AWS'],
      industryTrends: ['AI Integration', 'Micro-frontends', 'Web3'],
      salaryNegotiation: 'Highlight your React expertise - it\'s in top 5 most demanded skills'
    }
  });

  const toggleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
    }
    setSavedJobs(newSavedJobs);
  };

  const handleApplyNow = (job) => {
    if (job.isExternal && job.externalUrl) {
      window.open(job.externalUrl, '_blank');
    } else {
      // Navigate to internal application page
      window.location.href = `/jobs/${job.id}/apply`;
    }
  };

  const EnhancedJobCard = ({ job }) => (
    <Card className="hover-lift" sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {job.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {job.source && (
                  <Chip 
                    label={job.source} 
                    color={job.source === 'LinkedIn' ? 'primary' : job.source === 'GPT Enhanced' ? 'secondary' : 'default'} 
                    size="small"
                  />
                )}
                {job.matchScore && (
                  <Chip 
                    label={`${job.matchScore}% match`} 
                    color={job.matchScore >= 90 ? 'success' : job.matchScore >= 75 ? 'warning' : 'default'} 
                    size="small"
                    icon={<Star />}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 0.5, fontSize: 16 }} />
                {job.company}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 16 }} />
                {job.location}
              </Typography>
              {job.remote && (
                <Chip label="Remote" size="small" color="primary" variant="outlined" />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {job.description}
            </Typography>
            
            {job.gptReasoning && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>AI Insight:</strong> {job.gptReasoning}
                </Typography>
              </Alert>
            )}
            
            {job.careerGrowth && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Career Path:</strong> {job.careerGrowth}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {job.skills.map((skill, index) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 0.5, fontSize: 16 }} />
                {job.salary}
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ mr: 0.5, fontSize: 16 }} />
                {job.posted}
              </Typography>
              <Typography variant="body2">
                {job.applicants} applicants
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => toggleSaveJob(job.id)}>
                  {savedJobs.has(job.id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleApplyNow(job)}
                  endIcon={job.isExternal ? <Launch /> : null}
                  color={job.source === 'GPT Enhanced' ? 'secondary' : 'primary'}
                >
                  {job.isExternal ? 'Apply on LinkedIn' : 'Apply Now'}
                </Button>
                <Button variant="outlined" fullWidth>
                  View Details
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom className="page-choreo-heading" sx={{ fontWeight: 'bold' }}>
        Job Search
      </Typography>
      
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Job title, keywords, or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterList />}
            >
              Filters
            </Button>
          </Grid>
        </Grid>
        
        {/* Advanced Filters */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <MotionBox
              key="advanced-filters"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    <MenuItem value="">{t('All Types')}</MenuItem>
                    <MenuItem value="full-time">{t('Full-time')}</MenuItem>
                    <MenuItem value="part-time">Part-time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select 
                    value={experienceLevel} 
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <MenuItem value="">{t('All Levels')}</MenuItem>
                    <MenuItem value="entry">{t('Entry Level')}</MenuItem>
                    <MenuItem value="mid">{t('Mid Level')}</MenuItem>
                    <MenuItem value="senior">{t('Senior Level')}</MenuItem>
                    <MenuItem value="executive">{t('Executive')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Salary Range</Typography>
                  <Slider
                    value={salaryRange}
                    onChange={(e, newValue) => setSalaryRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={200000}
                    step={5000}
                    valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel
                    control={<Checkbox checked={remote} onChange={(e) => setRemote(e.target.checked)} />}
                    label="Remote Only"
                  />
                </Grid>
              </Grid>
            </MotionBox>
          )}
        </AnimatePresence>
        </Paper>

      <Grid container spacing={3} className="page-choreo-sections">
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Search Insights */}
          {searchInsights && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SmartToy sx={{ mr: 1 }} />
                AI Search Insights (Quality Score: {searchInsights.searchQuality?.score}%)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Market Analysis</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={t('Demand: {{level}}', { level: searchInsights.marketAnalysis?.demandLevel })} color="success" size="small" />
                    <Chip label={t('Salary Trend: {{trend}}', { trend: searchInsights.marketAnalysis?.salaryTrend })} color="info" size="small" />
                    <Chip label={t('Competition: {{level}}', { level: searchInsights.marketAnalysis?.competitionLevel })} color="warning" size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>{t('Recommendations')}</Typography>
                  {searchInsights.recommendations?.slice(0, 2).map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>• {rec}</Typography>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Job Results Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
              <Tab 
                label={`All Results (${jobs.length + linkedinJobs.length + gptJobs.length})`} 
                icon={<Work />} 
              />
              <Tab 
                label={`LinkedIn (${linkedinJobs.length})`} 
                icon={linkedinSearching ? <CircularProgress size={16} /> : <Business />} 
              />
              <Tab 
                label={`AI Enhanced (${gptJobs.length})`} 
                icon={gptSearching ? <CircularProgress size={16} /> : <SmartToy />} 
              />
              <Tab 
                label={`Recommended (${recommendedJobs.length})`} 
                icon={<Star />} 
              />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <LayoutGroup id="all-job-results">
            <Box className="flip-list">
              <Typography variant="h5" sx={{ mb: 2 }}>
                All Job Results ({jobs.length + linkedinJobs.length + gptJobs.length})
              </Typography>
              <AnimatePresence initial={false}>
                {[...gptJobs, ...linkedinJobs, ...jobs].map((job) => (
                  <MotionBox
                    key={`${job.source}_${job.id}`}
                    layout
                    className="flip-item"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <EnhancedJobCard job={job} />
                  </MotionBox>
                ))}
              </AnimatePresence>
            </Box>
            </LayoutGroup>
          )}

          {activeTab === 1 && (
            <LayoutGroup id="linkedin-job-results">
            <Box className="flip-list">
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1 }} />
                LinkedIn Jobs ({linkedinJobs.length})
                {linkedinSearching && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Typography>
              <AnimatePresence initial={false}>
                {linkedinJobs.map((job) => (
                  <MotionBox
                    key={job.id}
                    layout
                    className="flip-item"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <EnhancedJobCard job={job} />
                  </MotionBox>
                ))}
              </AnimatePresence>
            </Box>
            </LayoutGroup>
          )}

          {activeTab === 2 && (
            <LayoutGroup id="gpt-job-results">
            <Box className="flip-list">
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <SmartToy sx={{ mr: 1 }} />
                AI-Enhanced Jobs ({gptJobs.length})
                {gptSearching && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Typography>
              <AnimatePresence initial={false}>
                {gptJobs.map((job) => (
                  <MotionBox
                    key={job.id}
                    layout
                    className="flip-item"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <EnhancedJobCard job={job} />
                  </MotionBox>
                ))}
              </AnimatePresence>
            </Box>
            </LayoutGroup>
          )}

          {activeTab === 3 && (
            <LayoutGroup id="recommended-job-results">
            <Box className="flip-list">
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 1 }} />
                Recommended for You ({recommendedJobs.length})
                <Tooltip title="Refresh recommendations">
                  <IconButton onClick={fetchRecommendedJobs} sx={{ ml: 1 }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {recommendedJobs.length > 0 ? (
                    <AnimatePresence initial={false}>
                      {recommendedJobs.map((job) => (
                        <MotionBox
                          key={job.id}
                          layout
                          className="flip-item"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <EnhancedJobCard job={job} />
                        </MotionBox>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <Alert severity="info">
                      Upload your resume to get personalized job recommendations!
                    </Alert>
                  )}
                </>
              )}
            </Box>
            </LayoutGroup>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Saved Jobs */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Saved Jobs
              </Typography>
              {savedJobs.size > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You have {savedJobs.size} saved job(s)
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No saved jobs yet. Click the bookmark icon to save jobs.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Job Market Insights */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Market Insights
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Hot Skills" 
                    secondary="React, TypeScript, AWS"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Average Salary" 
                    secondary="$95,000 - $130,000"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Job Growth" 
                    secondary="+15% this quarter"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobSearchPage;
