import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Warning,
  TrendingUp,
  School,
  Work,
  Star,
  Lightbulb,
  Assignment,
  Psychology,
  Timeline,
  Assessment,
  Code,
  Business,
  Language,
  Build,
  Info,
  PlayArrow,
  CheckBox,
  AttachMoney
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const ResumeAnalysisPage = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetchCompleteAnalysis();
  }, [id]);

  const fetchCompleteAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Generate mock data for demonstration
      setAnalysis(generateMockAnalysis());
      setSkillAnalysis(generateMockSkillAnalysis());
      setMarketInsights(generateMockMarketInsights());
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis(generateMockAnalysis());
      setSkillAnalysis(generateMockSkillAnalysis());
      setMarketInsights(generateMockMarketInsights());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalysis = () => ({
    overallScore: 78,
    completeness: 85,
    skillsRelevance: 72,
    experienceDepth: 80,
    detailedAnalysis: {
      overallAssessment: 'Your resume shows strong technical skills but could benefit from more quantified achievements and better keyword optimization.',
      strengths: [
        'Strong Technical Skills Portfolio',
        'Clear Experience Timeline',
        'Good Education Background',
        'Relevant Project Experience',
        'Professional Formatting',
        'Industry-Relevant Keywords'
      ]
    },
    improvementAreas: [
      {
        area: 'Quantified Achievements',
        priority: 'high',
        issue: 'Most accomplishments lack specific metrics and numbers that demonstrate impact',
        suggestion: 'Add specific numbers, percentages, and measurable outcomes to your achievements to show concrete value',
        examples: [
          'Increased system performance by 40% through code optimization and database indexing',
          'Led a team of 5 developers to deliver project 2 weeks ahead of schedule, saving $50K in costs',
          'Reduced bug reports by 60% through implementation of comprehensive testing framework',
          'Improved user engagement by 25% through UI/UX enhancements'
        ],
        implementationSteps: [
          'Review each job experience and identify measurable outcomes',
          'Quantify your impact using numbers, percentages, or dollar amounts',
          'Use action verbs followed by specific results',
          'Include timeframes and scope of your achievements',
          'Add context about the business impact of your work'
        ]
      },
      {
        area: 'Technical Skills Section',
        priority: 'medium',
        issue: 'Skills section lacks organization and missing some current industry-relevant technologies',
        suggestion: 'Reorganize skills by category and add trending technologies relevant to your target roles',
        examples: [
          'Programming Languages: JavaScript (ES6+), Python, TypeScript, Java',
          'Frontend: React, Vue.js, Angular, HTML5, CSS3, Sass',
          'Backend: Node.js, Express, Django, Spring Boot',
          'Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD'
        ],
        implementationSteps: [
          'Categorize skills by type (Languages, Frameworks, Tools, etc.)',
          'Add proficiency levels or years of experience',
          'Include trending technologies in your field',
          'Remove outdated or irrelevant skills',
          'Align skills with job requirements you\'re targeting'
        ]
      },
      {
        area: 'Professional Summary',
        priority: 'medium',
        issue: 'Summary is too generic and doesn\'t highlight unique value proposition',
        suggestion: 'Create a compelling summary that showcases your unique strengths and career goals',
        examples: [
          'Full-stack developer with 5+ years building scalable web applications, specializing in React and Node.js',
          'Results-driven software engineer with expertise in cloud architecture and DevOps, delivered 20+ projects',
          'Passionate frontend developer focused on creating exceptional user experiences with modern JavaScript frameworks'
        ],
        implementationSteps: [
          'Start with your professional title and years of experience',
          'Highlight 2-3 key technical specializations',
          'Include a notable achievement or metric',
          'Mention your career goals or what you\'re seeking',
          'Keep it concise (3-4 lines maximum)'
        ]
      },
      {
        area: 'Project Descriptions',
        priority: 'low',
        issue: 'Project descriptions focus too much on technologies used rather than problems solved',
        suggestion: 'Reframe project descriptions to emphasize business problems solved and impact created',
        examples: [
          'Built e-commerce platform that increased online sales by 35% and reduced cart abandonment by 20%',
          'Developed real-time analytics dashboard that improved decision-making speed by 50% for management team',
          'Created automated testing suite that reduced deployment time from 4 hours to 30 minutes'
        ],
        implementationSteps: [
          'Start each project description with the business problem or goal',
          'Explain your role and key contributions',
          'Highlight the technologies used (but don\'t lead with them)',
          'Quantify the results and impact',
          'Include any recognition or feedback received'
        ]
      }
    ]
  });

  const generateMockSkillAnalysis = () => ({
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'HTML', 'CSS'],
    skillCategories: {
      technical: {
        programming: ['JavaScript', 'Python', 'Java', 'TypeScript'],
        frameworks: ['React', 'Node.js', 'Express', 'Django', 'Spring Boot'],
        databases: ['SQL', 'MongoDB', 'PostgreSQL', 'Redis']
      }
    },
    marketDemand: {
      high: ['JavaScript', 'React', 'Python', 'TypeScript', 'AWS'],
      medium: ['Node.js', 'SQL', 'Java', 'Docker']
    },
    skillGaps: [
      {
        skill: 'TypeScript',
        importance: 'high',
        reason: 'Highly demanded in modern React development and provides better code quality',
        learningPath: [
          'Complete TypeScript fundamentals course',
          'Convert existing JavaScript project to TypeScript',
          'Build new project using TypeScript from scratch',
          'Learn advanced TypeScript patterns and generics'
        ]
      },
      {
        skill: 'AWS Cloud Services',
        importance: 'high',
        reason: 'Cloud skills are essential for modern web development and deployment',
        learningPath: [
          'Get AWS Cloud Practitioner certification',
          'Learn core services: EC2, S3, RDS, Lambda',
          'Practice with hands-on labs and projects',
          'Deploy applications using AWS services'
        ]
      },
      {
        skill: 'Docker & Containerization',
        importance: 'medium',
        reason: 'Containerization is standard practice for application deployment and development',
        learningPath: [
          'Learn Docker fundamentals and commands',
          'Containerize existing applications',
          'Learn Docker Compose for multi-container apps',
          'Explore Kubernetes for orchestration'
        ]
      }
    ]
  });

  const generateMockMarketInsights = () => ({
    demand: 92,
    averageSalary: 95000,
    growth: 18,
    jobOpenings: 2847,
    salaryRange: { min: 70000, max: 140000 },
    topCompanies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'],
    trends: {
      emerging: ['TypeScript', 'Next.js', 'GraphQL', 'Rust', 'WebAssembly', 'AI/ML Integration'],
      stable: ['React', 'Node.js', 'Python', 'JavaScript', 'AWS', 'Docker'],
      declining: ['jQuery', 'AngularJS', 'PHP (legacy)', 'Flash']
    },
    industryGrowth: {
      fintech: 25,
      healthtech: 22,
      edtech: 18,
      ecommerce: 15
    },
    remoteOpportunities: 78,
    skillPremiums: {
      'TypeScript': 15,
      'AWS': 20,
      'React': 12,
      'Python': 18
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getDemandColor = (demand) => {
    if (demand >= 80) return 'success';
    if (demand >= 60) return 'warning';
    return 'error';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6"><Trans>Analyzing your resume...</Trans></Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Complete Resume Analysis
      </Typography>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<Assessment />} label="Overall Analysis" />
          <Tab icon={<Psychology />} label="Skill Analysis" />
          <Tab icon={<Timeline />} label="Market Insights" />
          <Tab icon={<Build />} label={<Trans>Implementation Guide</Trans>} />
        </Tabs>
      </Paper>

      {/* Skill Analysis Tab */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Skills Overview */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Code sx={{ mr: 1 }} />
                    Technical Skills Analysis
                  </Typography>
                  
                  {skillAnalysis?.skillCategories?.technical && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>Programming Languages</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {skillAnalysis.skillCategories.technical.programming?.map((skill, index) => (
                          <Chip key={index} label={skill} color="primary" variant="outlined" />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom><Trans>Frameworks & Libraries</Trans></Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {skillAnalysis.skillCategories.technical.frameworks?.map((skill, index) => (
                          <Chip key={index} label={skill} color="secondary" variant="outlined" />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>Databases</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skillAnalysis.skillCategories.technical.databases?.map((skill, index) => (
                          <Chip key={index} label={skill} color="success" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Market Demand */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Market Demand Analysis
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom color="success.main"><Trans>High Demand Skills</Trans></Typography>
                    <List dense>
                      {skillAnalysis?.marketDemand?.high?.map((skill, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={skill} />
                          <Chip label="Hot" color="success" size="small" />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="warning.main">Medium Demand Skills</Typography>
                    <List dense>
                      {skillAnalysis?.marketDemand?.medium?.map((skill, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Warning color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={skill} />
                          <Chip label="Stable" color="warning" size="small" />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Skill Gaps */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Psychology sx={{ mr: 1 }} />
                    Critical Skill Gaps & Learning Path
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {skillAnalysis?.skillGaps?.map((gap, index) => (
                      <Grid item xs={12} md={6} lg={4} key={index}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                              {gap.skill}
                            </Typography>
                            <Chip 
                              label={`${gap.importance} Priority`}
                              color={gap.importance === 'high' ? 'error' : 'warning'}
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="body2" gutterBottom>
                              <strong><Trans>Why Important:</Trans></strong> {gap.reason}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Learning Path:</Typography>
                            <List dense>
                              {gap.learningPath?.map((step, stepIndex) => (
                                <ListItem key={stepIndex}>
                                  <ListItemIcon>
                                    <PlayArrow fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={step}
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
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Market Insights Tab */}
      {tabValue === 2 && (
        <Box>
          <Grid container spacing={3}>
            {/* Market Overview */}
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Market Intelligence Dashboard
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{marketInsights?.demand || 92}%</Typography>
                        <Typography variant="body2">Market Demand</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>${(marketInsights?.averageSalary || 85000).toLocaleString()}</Typography>
                        <Typography variant="body2">Average Salary</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>+{marketInsights?.growth || 15}%</Typography>
                        <Typography variant="body2">YoY Growth</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{(marketInsights?.jobOpenings || 1247).toLocaleString()}</Typography>
                        <Typography variant="body2">Job Openings</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Salary Analysis */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    Salary Analysis
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Salary Range</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" color="success.main">
                        ${marketInsights?.salaryRange?.min?.toLocaleString() || '65,000'}
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        ${marketInsights?.averageSalary?.toLocaleString() || '85,000'}
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        ${marketInsights?.salaryRange?.max?.toLocaleString() || '120,000'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="caption"><Trans>Min</Trans></Typography>
                      <Typography variant="caption"><Trans>Average</Trans></Typography>
                      <Typography variant="caption"><Trans>Max</Trans></Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={75} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>Top Paying Companies</Typography>
                  <List dense>
                    {marketInsights?.topCompanies?.map((company, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Business color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={company} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Technology Trends */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline sx={{ mr: 1 }} />
                    Technology Trends
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom color="success.main">Emerging Technologies</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {marketInsights?.trends?.emerging?.map((tech, index) => (
                        <Chip key={index} label={tech} color="success" size="small" icon={<TrendingUp />} />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom color="primary.main"><Trans>Stable Technologies</Trans></Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {marketInsights?.trends?.stable?.map((tech, index) => (
                        <Chip key={index} label={tech} color="primary" size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="warning.main">Declining Technologies</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {marketInsights?.trends?.declining?.map((tech, index) => (
                        <Chip key={index} label={tech} color="warning" size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Implementation Guide Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Complete Implementation Guide
          </Typography>
          
          <Grid container spacing={3}>
            {analysis?.improvementAreas?.map((area, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Build sx={{ mr: 1 }} />
                      {area.area} Implementation
                      <Chip 
                        label={area.priority} 
                        color={getPriorityColor(area.priority)}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                    
                    <Stepper activeStep={activeStep} orientation="vertical">
                      {area.implementationSteps?.map((step, stepIndex) => (
                        <Step key={stepIndex}>
                          <StepLabel 
                            onClick={() => handleStepClick(stepIndex)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <Typography variant="subtitle1">{step}</Typography>
                          </StepLabel>
                          <StepContent>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="body2" gutterBottom>
                                Detailed implementation guidance for: {step}
                              </Typography>
                              
                              {area.examples && area.examples[stepIndex] && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                  <Typography variant="body2">
                                    <strong>Example:</strong> {area.examples[stepIndex]}
                                  </Typography>
                                </Box>
                              )}
                              
                              <Box sx={{ mt: 2 }}>
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  onClick={() => setActiveStep(stepIndex + 1)}
                                >
                                  {/* TODO: Internationalize */}
                                  Mark Complete
                                </Button>
                              </Box>
                            </Box>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box>
          {/* Overall Score Dashboard */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {analysis?.overallScore || 0}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Overall Score
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={analysis?.overallScore >= 80 ? 'Excellent' : analysis?.overallScore >= 60 ? 'Good' : 'Needs Work'}
                      color={analysis?.overallScore >= 80 ? 'success' : analysis?.overallScore >= 60 ? 'warning' : 'error'}
                      sx={{ color: 'white', fontWeight: 'bold' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {analysis?.detailedAnalysis?.overallAssessment || 'Resume analysis completed'}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">{analysis?.completeness || 0}%</Typography>
                        <Typography variant="body2" color="text.secondary">Completeness</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analysis?.completeness || 0} 
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">{analysis?.skillsRelevance || 0}%</Typography>
                        <Typography variant="body2" color="text.secondary">Skills Relevance</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analysis?.skillsRelevance || 0} 
                          color="secondary"
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">{analysis?.experienceDepth || 0}%</Typography>
                        <Typography variant="body2" color="text.secondary">Experience Depth</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analysis?.experienceDepth || 0} 
                          color="success"
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Strengths and Weaknesses */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    Your Strengths ({analysis?.detailedAnalysis?.strengths?.length || 0})
                  </Typography>
                  <List>
                    {analysis?.detailedAnalysis?.strengths?.map((strength, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Star color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={strength}
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Warning color="warning" sx={{ mr: 1 }} />
                    Priority Improvements ({analysis?.improvementAreas?.length || 0})
                  </Typography>
                  <List>
                    {analysis?.improvementAreas?.slice(0, 4).map((area, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUp color={getPriorityColor(area.priority)} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={area.area}
                          secondary={area.issue}
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <Chip 
                          label={area.priority} 
                          color={getPriorityColor(area.priority)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Improvement Areas */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Build color="primary" sx={{ mr: 1 }} />
                Detailed Improvement Plan
              </Typography>
              {analysis?.improvementAreas?.map((area, index) => (
                <Accordion key={index} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        {area.area}
                      </Typography>
                      <Chip 
                        label={area.priority} 
                        color={getPriorityColor(area.priority)}
                        size="small"
                        sx={{ mr: 2 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom color="error">
                          Issue Identified
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                          {area.issue}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          Recommended Solution
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                          {area.suggestion}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        {area.examples && area.examples.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom color="success.main">
                              Examples to Follow
                            </Typography>
                            {area.examples.map((example, idx) => (
                              <Box key={idx} sx={{ mb: 1, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Typography variant="body2">{example}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        
                        {area.implementationSteps && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom color="info.main">
                              Implementation Steps
                            </Typography>
                            <Stepper orientation="vertical" sx={{ mt: 1 }}>
                              {area.implementationSteps.map((step, stepIndex) => (
                                <Step key={stepIndex} active={true}>
                                  <StepLabel>
                                    <Typography variant="body2">{step}</Typography>
                                  </StepLabel>
                                </Step>
                              ))}
                            </Stepper>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.href = '/resume/upload'}
        >
          Upload New Resume
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => window.location.href = '/jobs/recommendations'}
        >
          View Job Recommendations
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
  );
};

export default ResumeAnalysisPage;
