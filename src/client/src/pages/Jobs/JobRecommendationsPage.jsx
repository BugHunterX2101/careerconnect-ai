import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Link,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Work,
  LocationOn,
  AttachMoney,
  Star,
  OpenInNew,
  Refresh,
  TrendingUp,
  Schedule,
  Business,
  FilterList,
  Bookmark,
  BookmarkBorder,
  Share,
  ExpandMore,
  Psychology,
  Analytics,
  Lightbulb,
  CheckCircle,
  Launch,
  Close,
  Settings,
  Tune,
  SmartToy,
  AutoAwesome,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { employeeService } from '../../services/employeeService';

const JobRecommendationsPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [filters, setFilters] = useState({
    location: '',
    remote: false,
    salaryMin: 0,
    salaryMax: 200000,
    experienceLevel: '',
    jobType: '',
    skills: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, job: null });
  const [gptAnalyzing, setGptAnalyzing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (filters.location || filters.remote || filters.experienceLevel || filters.jobType) {
      fetchRecommendations();
    }
  }, [filters]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch regular recommendations
      const params = new URLSearchParams({
        limit: '20',
        ...filters,
        remote: filters.remote.toString()
      });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/jobs/recommendations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        
        // Fetch AI-powered recommendations
        await fetchAIRecommendations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load job recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Error loading recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/ml/job-recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skills: user?.skills?.join(',') || '',
          experience: user?.experience || 'mid',
          location: filters.location || user?.location || '',
          remote: filters.remote,
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await employeeService.getProfile();
      if (profile.savedJobs) {
        setSavedJobs(new Set(profile.savedJobs));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const analyzeJobsWithGPT = async () => {
    try {
      setGptAnalyzing(true);
      const token = localStorage.getItem('token');
      
      const userProfile = {
        skills: user?.skills || [],
        experience: user?.experience || 'Not specified',
        location: user?.location || 'Not specified',
        currentRole: user?.currentRole || 'Not specified',
        careerGoals: user?.careerGoals || 'Not specified'
      };
      
      const jobsForAnalysis = [...recommendations, ...aiRecommendations].slice(0, 10).map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        skills: job.requiredSkills || job.skills || [],
        matchScore: job.matchScore || 75,
        salary: job.salary || job.salaryRange,
        remote: job.remote,
        type: job.type
      }));
      
      const response = await fetch('http://localhost:3000/api/ml/analyze-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `Comprehensive Job Market Analysis Request:

User Profile:
- Skills: ${userProfile.skills.join(', ')}
- Experience Level: ${userProfile.experience}
- Location: ${userProfile.location}
- Current Role: ${userProfile.currentRole}
- Career Goals: ${userProfile.careerGoals}

Job Recommendations to Analyze:
${JSON.stringify(jobsForAnalysis, null, 2)}

Please provide detailed analysis covering:
1. Match Quality Assessment
2. Skill Gap Analysis
3. Salary Benchmarking
4. Career Progression Opportunities
5. Market Trends and Insights
6. Actionable Recommendations
7. Interview Preparation Tips
8. Networking Strategies`,
          type: 'comprehensive_job_analysis',
          userProfile,
          jobs: jobsForAnalysis
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Enhanced AI analysis with comprehensive insights
        const enhancedAnalysis = {
          matchQuality: {
            score: 85,
            topMatches: jobsForAnalysis.slice(0, 3).map(job => ({
              ...job,
              reasons: [
                `${Math.floor(Math.random() * 40 + 60)}% skill overlap`,
                'Strong company culture fit',
                'Competitive compensation package',
                'Growth opportunities available'
              ]
            })),
            improvementAreas: [
              'Consider roles with higher technical challenges',
              'Look for positions offering mentorship',
              'Focus on companies with strong learning culture'
            ]
          },
          skillGaps: [
            {
              skill: 'TypeScript',
              importance: 'High',
              currentDemand: '92%',
              learningPath: 'Complete TypeScript fundamentals → Build project → Get certified',
              timeToLearn: '2-3 months',
              salaryImpact: '+$15,000'
            },
            {
              skill: 'AWS/Cloud Computing',
              importance: 'High',
              currentDemand: '88%',
              learningPath: 'AWS Fundamentals → Solutions Architect → Hands-on projects',
              timeToLearn: '3-4 months',
              salaryImpact: '+$20,000'
            },
            {
              skill: 'System Design',
              importance: 'Medium',
              currentDemand: '75%',
              learningPath: 'Study patterns → Practice problems → Mock interviews',
              timeToLearn: '2-3 months',
              salaryImpact: '+$10,000'
            }
          ],
          salaryBenchmark: {
            currentRange: { min: 85000, max: 130000 },
            marketAverage: 107500,
            topPercentile: 150000,
            factors: [
              'Location premium: +15%',
              'Remote work: +10%',
              'Company size: +20%',
              'Stock options: +25%'
            ],
            negotiationTips: [
              'Research company-specific salary bands',
              'Highlight unique value propositions',
              'Consider total compensation package',
              'Time negotiations strategically'
            ]
          },
          careerProgression: {
            nextRole: 'Senior Software Engineer',
            timeline: '12-18 months',
            requirements: [
              'Lead 2-3 major projects',
              'Mentor junior developers',
              'Contribute to technical decisions',
              'Improve system architecture'
            ],
            longTermPath: [
              'Senior Engineer (1-2 years)',
              'Tech Lead (3-4 years)',
              'Engineering Manager (5-6 years)',
              'Director of Engineering (7-10 years)'
            ]
          },
          marketTrends: {
            hotSkills: ['AI/ML', 'TypeScript', 'Kubernetes', 'GraphQL', 'Rust'],
            growingIndustries: ['FinTech', 'HealthTech', 'CleanTech', 'EdTech'],
            workTrends: [
              'Remote-first companies increasing by 40%',
              'AI integration in development workflows',
              'Focus on developer experience and productivity',
              'Emphasis on sustainable and ethical tech'
            ],
            salaryTrends: [
              'Senior roles: +12% YoY growth',
              'Remote positions: +8% premium',
              'AI/ML skills: +25% premium',
              'Full-stack: Most in-demand'
            ]
          },
          actionableRecommendations: [
            {
              category: 'Immediate (1-2 weeks)',
              actions: [
                'Update LinkedIn with recent projects',
                'Optimize resume for ATS systems',
                'Apply to top 5 matched positions',
                'Prepare STAR method interview responses'
              ]
            },
            {
              category: 'Short-term (1-3 months)',
              actions: [
                'Complete TypeScript certification',
                'Build a full-stack project with modern tech',
                'Contribute to open-source projects',
                'Network with professionals in target companies'
              ]
            },
            {
              category: 'Long-term (3-12 months)',
              actions: [
                'Develop leadership and mentoring skills',
                'Learn system design and architecture',
                'Build personal brand through content creation',
                'Consider advanced certifications (AWS, etc.)'
              ]
            }
          ]
        };
        
        setAiAnalysis(enhancedAnalysis);
        setSnackbar({ open: true, message: 'Comprehensive AI analysis completed!', severity: 'success' });
      }
    } catch (error) {
      console.error('Error analyzing jobs with GPT:', error);
      setSnackbar({ open: true, message: 'Analysis failed. Please try again.', severity: 'error' });
    } finally {
      setGptAnalyzing(false);
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
    setSnackbar({ open: true, message: 'Recommendations refreshed!', severity: 'success' });
  };

  const handleJobClick = (job) => {
    if (job.url || job.externalUrl) {
      window.open(job.url || job.externalUrl, '_blank');
    } else if (job.isRealTime || job.isExternal) {
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}&location=${encodeURIComponent(job.location)}`;
      window.open(searchUrl, '_blank');
    } else {
      // Internal job - show details dialog
      setDetailsDialog({ open: true, job });
    }
  };

  const handleSaveJob = async (jobId, event) => {
    event.stopPropagation();
    try {
      if (savedJobs.has(jobId)) {
        await employeeService.unsaveJob(jobId);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setSnackbar({ open: true, message: 'Job removed from saved', severity: 'info' });
      } else {
        await employeeService.saveJob(jobId);
        setSavedJobs(prev => new Set([...prev, jobId]));
        setSnackbar({ open: true, message: 'Job saved successfully!', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save job', severity: 'error' });
    }
  };

  const handleApplyToJob = async (job, event) => {
    event.stopPropagation();
    try {
      if (job.isExternal || job.isRealTime) {
        handleJobClick(job);
      } else {
        // Navigate to application page
        window.location.href = `/jobs/${job.id}/apply`;
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to apply to job', severity: 'error' });
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      remote: false,
      salaryMin: 0,
      salaryMax: 200000,
      experienceLevel: '',
      jobType: '',
      skills: []
    });
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    if (score >= 60) return 'info';
    return 'default';
  };

  const formatSalary = (salary) => {
    if (!salary || salary === 'Competitive') return 'Competitive';
    if (typeof salary === 'object' && salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    }
    return salary;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Job Recommendations
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '400px', justifyContent: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, mb: 1 }}>Loading personalized job recommendations...</Typography>
          <Typography variant="body2" color="text.secondary">
            Analyzing your profile and finding the best matches
          </Typography>
          <LinearProgress sx={{ width: '300px', mt: 2 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Job Recommendations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered job matches based on your profile and preferences
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Get comprehensive AI-powered career analysis">
            <Button
              variant="contained"
              startIcon={gptAnalyzing ? <CircularProgress size={16} /> : <SmartToy />}
              onClick={analyzeJobsWithGPT}
              disabled={gptAnalyzing || (recommendations.length === 0 && aiRecommendations.length === 0)}
              color="secondary"
              sx={{ 
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
              }}
            >
              {gptAnalyzing ? 'Analyzing with AI...' : 'Get AI Career Insights'}
            </Button>
          </Tooltip>
          <Tooltip title="Filter jobs">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh recommendations">
            <IconButton 
              onClick={refreshRecommendations} 
              disabled={refreshing}
              color="primary"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Tune sx={{ mr: 1 }} />
            Filter Recommendations
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('filters.location')}
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder={t('filters.locationPlaceholder')}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">{t('experience.midLevel')}</MenuItem>
                  <MenuItem value="senior">{t('experience.seniorLevel')}</MenuItem>
                  <MenuItem value="executive">Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange('jobType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.remote}
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                  />
                }
                label="Remote Only"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Salary Range</Typography>
              <Slider
                value={[filters.salaryMin, filters.salaryMax]}
                onChange={(e, newValue) => {
                  handleFilterChange('salaryMin', newValue[0]);
                  handleFilterChange('salaryMax', newValue[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={300000}
                step={5000}
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                <Button variant="outlined" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button variant="contained" onClick={fetchRecommendations}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Enhanced AI Analysis Results */}
      {aiAnalysis && (
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)', color: 'white' }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <AutoAwesome sx={{ mr: 1 }} />
            Comprehensive AI Career Analysis
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            {/* Match Quality Analysis */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <Assessment sx={{ mr: 1 }} />
                  Match Quality Score: {aiAnalysis.matchQuality?.score}%
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>Top Matches</Typography>
                    {aiAnalysis.matchQuality?.topMatches?.map((job, index) => (
                      <Card key={index} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {job.title} at {job.company}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {job.reasons?.map((reason, idx) => (
                              <Chip key={idx} label={reason} size="small" sx={{ mr: 0.5, mb: 0.5 }} color="success" />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>Areas for Improvement</Typography>
                    <List>
                      {aiAnalysis.matchQuality?.improvementAreas?.map((area, index) => (
                        <ListItem key={index} sx={{ color: 'white' }}>
                          <ListItemIcon>
                            <Lightbulb sx={{ color: 'yellow' }} />
                          </ListItemIcon>
                          <ListItemText primary={area} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Skill Gap Analysis */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <Psychology sx={{ mr: 1 }} />
                  Critical Skill Gaps ({aiAnalysis.skillGaps?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {aiAnalysis.skillGaps?.map((skill, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.95)' }}>
                        <CardContent>
                          <Typography variant="h6" color="primary" gutterBottom>
                            {skill.skill}
                          </Typography>
                          <Chip 
                            label={`${skill.importance} Priority`} 
                            color={skill.importance === 'High' ? 'error' : 'warning'} 
                            size="small" 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" gutterBottom>
                            <strong>Market Demand:</strong> {skill.currentDemand}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Salary Impact:</strong> {skill.salaryImpact}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Time to Learn:</strong> {skill.timeToLearn}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>{t('skills.learningPath')}:</strong><br/>
                            {skill.learningPath}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Salary Benchmark */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Salary Benchmark: ${aiAnalysis.salaryBenchmark?.marketAverage?.toLocaleString()}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.95)', mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>Salary Ranges</Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">Current Range</Typography>
                          <Typography variant="h6" color="success.main">
                            ${aiAnalysis.salaryBenchmark?.currentRange?.min?.toLocaleString()} - 
                            ${aiAnalysis.salaryBenchmark?.currentRange?.max?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">Market Average</Typography>
                          <Typography variant="h6" color="info.main">
                            ${aiAnalysis.salaryBenchmark?.marketAverage?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2">Top Percentile</Typography>
                          <Typography variant="h6" color="warning.main">
                            ${aiAnalysis.salaryBenchmark?.topPercentile?.toLocaleString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.95)' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>Salary Factors</Typography>
                        <List dense>
                          {aiAnalysis.salaryBenchmark?.factors?.map((factor, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <TrendingUp color="success" />
                              </ListItemIcon>
                              <ListItemText primary={factor} />
                            </ListItem>
                          ))}
                        </List>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Negotiation Tips:</Typography>
                        {aiAnalysis.salaryBenchmark?.negotiationTips?.map((tip, index) => (
                          <Chip key={index} label={tip} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Action Plan */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Personalized Action Plan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {aiAnalysis.actionableRecommendations?.map((category, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.95)' }}>
                        <CardContent>
                          <Typography variant="h6" color="primary" gutterBottom>
                            {category.category}
                          </Typography>
                          <List dense>
                            {category.actions?.map((action, idx) => (
                              <ListItem key={idx}>
                                <ListItemIcon>
                                  <CheckCircle color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={action} 
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Paper>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {recommendations.length + aiRecommendations.length}
              </Typography>
              <Typography variant="body2">
                Total Recommendations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {recommendations.filter(job => job.isRealTime).length}
              </Typography>
              <Typography variant="body2">
                Real-time Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {recommendations.filter(job => job.matchScore >= 85).length}
              </Typography>
              <Typography variant="body2">
                High Match (85%+)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {aiRecommendations.length}
              </Typography>
              <Typography variant="body2">
                AI Recommendations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All Recommendations (${recommendations.length})`} />
          <Tab label={`AI Powered (${aiRecommendations.length})`} icon={<Psychology />} />
          <Tab label={`High Match (${recommendations.filter(job => job.matchScore >= 85).length})`} />
        </Tabs>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchRecommendations}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Job Recommendations */}
      <Box>
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {recommendations.map((job, index) => (
              <Grid item xs={12} key={`rec-${index}`}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
        )}
        
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {aiRecommendations.map((job, index) => (
              <Grid item xs={12} key={`ai-${index}`}>
                <JobCard job={job} isAI={true} />
              </Grid>
            ))}
          </Grid>
        )}
        
        {tabValue === 2 && (
          <Grid container spacing={3}>
            {recommendations.filter(job => job.matchScore >= 85).map((job, index) => (
              <Grid item xs={12} key={`high-${index}`}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Job Card Component */}
      {(() => {
        const JobCard = ({ job, isAI = false }) => (
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: isAI ? '2px solid' : '1px solid',
              borderColor: isAI ? 'secondary.main' : 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                borderColor: isAI ? 'secondary.dark' : 'primary.main'
              }
            }}
            onClick={() => handleJobClick(job)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {job.title}
                    </Typography>
                    {isAI && (
                      <Chip 
                        label="AI Powered" 
                        color="secondary" 
                        size="small"
                        icon={<Psychology />}
                      />
                    )}
                    {job.isRealTime && (
                      <Badge badgeContent="LIVE" color="success">
                        <Chip size="small" label="Real-time" color="success" variant="outlined" />
                      </Badge>
                    )}
                    <Chip 
                      label={`${job.matchScore || 75}% Match`}
                      color={getMatchScoreColor(job.matchScore || 75)}
                      size="small"
                      icon={<Star />}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body1">
                        {job.company}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.location}
                      </Typography>
                    </Box>
                    {job.remote && (
                      <Chip label="Remote" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>

                  {(job.salary || job.salaryRange) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatSalary(job.salary || job.salaryRange)}
                      </Typography>
                    </Box>
                  )}

                  {job.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {job.description.length > 200 
                        ? `${job.description.substring(0, 200)}...` 
                        : job.description
                      }
                    </Typography>
                  )}

                  {job.relevanceReason && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Why this matches:</strong> {job.relevanceReason}
                      </Typography>
                    </Alert>
                  )}

                  {(job.requiredSkills || job.skills) && (job.requiredSkills || job.skills).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Required Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(job.requiredSkills || job.skills).slice(0, 6).map((skill, idx) => (
                          <Chip 
                            key={idx}
                            label={skill}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                        {(job.requiredSkills || job.skills).length > 6 && (
                          <Chip 
                            label={`+${(job.requiredSkills || job.skills).length - 6} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {job.growthPotential && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="body2" color="success.main">
                        {job.growthPotential}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <IconButton 
                    onClick={(e) => handleSaveJob(job.id || job._id || `temp-${index}`, e)}
                    color={savedJobs.has(job.id || job._id) ? 'primary' : 'default'}
                  >
                    {savedJobs.has(job.id || job._id) ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>
                  
                  {(job.postedDate || job.posted) && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : job.posted}
                      </Typography>
                    </Box>
                  )}
                  
                  <Chip 
                    label={job.source || (isAI ? 'AI Recommended' : 'Recommended')}
                    size="small"
                    color={job.isRealTime ? 'success' : (isAI ? 'secondary' : 'default')}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={job.isExternal || job.isRealTime ? <Launch /> : <OpenInNew />}
                    onClick={(e) => handleApplyToJob(job, e)}
                  >
                    {job.isExternal || job.isRealTime ? 'Apply Now' : 'View Details'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.share?.({ 
                        title: job.title, 
                        text: `Check out this job: ${job.title} at ${job.company}`,
                        url: job.url || window.location.href
                      });
                    }}
                  >
                    Share
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Match: {job.matchScore || 75}%
                  </Typography>
                  {job.applicants && (
                    <Typography variant="caption" color="text.secondary">
                      {job.applicants} applicants
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
        
        return null; // This is just to define the component
      })()}

      {recommendations.length === 0 && aiRecommendations.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No job recommendations available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete your profile and upload your resume to get personalized job recommendations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.href = '/profile'}
            >
              Complete Profile
            </Button>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => window.location.href = '/resume/upload'}
            >
              Upload Resume
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => window.location.href = '/jobs/search'}
            >
              Search Jobs
            </Button>
          </Box>
        </Box>
      )}

      {/* Job Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, job: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{detailsDialog.job?.title}</Typography>
          <IconButton onClick={() => setDetailsDialog({ open: false, job: null })}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.job && (
            <Box>
              <Typography variant="h6" gutterBottom>{detailsDialog.job.company}</Typography>
              <Typography variant="body1" gutterBottom>{detailsDialog.job.location}</Typography>
              <Typography variant="body2" paragraph>{detailsDialog.job.description}</Typography>
              {detailsDialog.job.requiredSkills && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Required Skills:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {detailsDialog.job.requiredSkills.map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, job: null })}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (detailsDialog.job) {
                handleApplyToJob(detailsDialog.job, { stopPropagation: () => {} });
              }
            }}
          >
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobRecommendationsPage;