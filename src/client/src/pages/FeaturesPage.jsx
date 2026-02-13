import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
  TrendingUp,
  Security,
  Speed,
  Analytics,
  Work,
  Chat,
  VideoCall,
  LinkedIn,
  GitHub,
  Google,
  CheckCircle,
  Rocket,
  School,
  Business,
  Assessment,
  Schedule,
  People,
  Description,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FeaturesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: <Psychology sx={{ fontSize: 48 }} />,
      title: 'BERT-Powered Resume Analysis',
      description: 'Advanced AI parsing with 95%+ accuracy for skill extraction, experience analysis, and improvement suggestions.',
      gradient: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
      features: [
        'Intelligent skill extraction from any resume format',
        'Experience level assessment and categorization',
        'Gap analysis with personalized recommendations',
        'ATS optimization scoring and suggestions',
        'Multi-language support for global professionals'
      ]
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 48 }} />,
      title: 'GPT-Enhanced Job Matching',
      description: 'Machine learning algorithms that understand context, preferences, and career goals for perfect job matches.',
      gradient: 'linear-gradient(135deg, #C4A574 0%, #D4BA94 100%)',
      features: [
        'Contextual job recommendations based on career goals',
        'Real-time matching with 15+ criteria analysis',
        'Learning algorithm that improves with user feedback',
        'Location, salary, and culture fit optimization',
        'Industry trend analysis and future job predictions'
      ]
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      title: 'Career Intelligence Platform',
      description: 'Real-time market insights, salary predictions, and personalized career roadmaps powered by AI.',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      features: [
        'Market demand analysis for skills and roles',
        'Salary prediction with 90%+ accuracy',
        'Career path recommendations with timelines',
        'Skill development prioritization',
        'Industry growth forecasting and opportunities'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Chat />,
      title: 'Real-Time Communication',
      description: 'Socket.IO-powered messaging with file sharing and live notifications.',
      color: '#3b82f6'
    },
    {
      icon: <VideoCall />,
      title: 'Video Interview System',
      description: 'Google Meet integration with WebRTC peer-to-peer calling.',
      color: '#ef4444'
    },
    {
      icon: <Security />,
      title: 'Enterprise Security',
      description: 'Bank-level security with OAuth 2.0 and end-to-end encryption.',
      color: '#f59e0b'
    },
    {
      icon: <Speed />,
      title: 'Lightning Performance',
      description: 'Sub-3 second load times with real-time processing.',
      color: '#D4BA94'
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards with actionable insights.',
      color: '#06b6d4'
    },
    {
      icon: <LinkedIn />,
      title: 'LinkedIn Integration',
      description: 'Direct job posting and candidate sourcing from LinkedIn.',
      color: '#0077b5'
    }
  ];

  const integrations = [
    { name: 'Google Workspace', icon: <Google />, description: 'Calendar, Meet, Drive integration' },
    { name: 'LinkedIn API', icon: <LinkedIn />, description: 'Job posting and candidate search' },
    { name: 'GitHub OAuth', icon: <GitHub />, description: 'Developer profile integration' },
    { name: 'OpenAI GPT', icon: <Psychology />, description: 'Advanced language processing' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Chip
              label="🚀 AI-Powered Features"
              sx={{
                mb: 3,
                backgroundColor: alpha('#ffffff', 0.2),
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem' },
                mb: 3,
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              Revolutionary AI Features
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                maxWidth: 800,
                mx: 'auto',
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              Discover how our cutting-edge artificial intelligence transforms every aspect
              of your career journey with unprecedented accuracy and intelligence.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                px: 6,
                py: 2,
                fontSize: '1.375rem',
                fontWeight: 700,
                borderRadius: 3,
                border: '3px solid #FBBF24',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5), 0 0 40px rgba(251, 191, 36, 0.4)',
                animation: 'subtleGlow 2s ease-in-out infinite',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: '0 12px 48px rgba(245, 158, 11, 0.7), 0 0 50px rgba(251, 191, 36, 0.6)',
                  borderColor: '#FCD34D',
                },
              }}
            >
              Try Features Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Features */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={6}>
          {mainFeatures.map((feature, index) => (
            <Grid item xs={12} key={index}>
              <Card
                className="feature-card"
                sx={{
                  p: 4,
                  borderRadius: 4,
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: feature.gradient,
                  }}
                />
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          background: feature.gradient,
                          color: 'white',
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {feature.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List>
                      {feature.features.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{
                              fontWeight: 500,
                              fontSize: '1rem',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Additional Features Grid */}
      <Box sx={{ backgroundColor: '#f8fafc', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
              Complete Feature Suite
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Everything you need for career success in one platform
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {additionalFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  className="hover-lift"
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 3,
                    border: 'none',
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      backgroundColor: feature.color,
                      color: 'white',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Integrations */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
            Powerful Integrations
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Connect with your favorite tools and platforms
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {integrations.map((integration, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                className="hover-lift"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '2px solid #f1f5f9',
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {integration.icon}
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  {integration.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {integration.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
              Ready to Experience AI-Powered Career Growth?
            </Typography>
            <Typography variant="h6" paragraph sx={{ opacity: 0.9, mb: 4 }}>
              Join thousands of professionals who have transformed their careers with our AI platform.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  px: 6,
                  py: 2,
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  border: '3px solid #FBBF24',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5), 0 0 40px rgba(251, 191, 36, 0.4)',
                  animation: 'subtleGlow 2s ease-in-out infinite',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: '0 12px 48px rgba(245, 158, 11, 0.7), 0 0 50px rgba(251, 191, 36, 0.6)',
                    borderColor: '#FCD34D',
                  },
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/pricing')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 5,
                  py: 2,
                  fontSize: '1.375rem',
                  fontWeight: 600,
                  borderWidth: 3,
                  borderRadius: 3,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: alpha('#ffffff', 0.15),
                    transform: 'translateY(-2px)',
                    borderWidth: 3,
                  },
                }}
              >
                View Pricing
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default FeaturesPage;