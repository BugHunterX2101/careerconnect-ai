import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Button,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Psychology,
  Rocket,
  TrendingUp,
  Security,
  People,
  School,
  Work,
  Analytics,
  LinkedIn,
  GitHub,
  Google,
  Star,
  Timeline,
  EmojiEvents,
  Language,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const stats = [
    { number: '50,000+', label: 'Active Users', icon: <People /> },
    { number: '10,000+', label: 'Jobs Posted', icon: <Work /> },
    { number: '95%', label: 'Match Accuracy', icon: <TrendingUp /> },
    { number: '24/7', label: 'AI Support', icon: <Psychology /> },
  ];

  const team = [
    {
      name: 'Alex Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former Google AI researcher with 10+ years in machine learning and career development.',
      avatar: 'AC',
      linkedin: '#',
    },
    {
      name: 'Sarah Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Microsoft engineer specializing in NLP and distributed systems architecture.',
      avatar: 'SR',
      linkedin: '#',
    },
    {
      name: 'Michael Johnson',
      role: 'Head of AI',
      bio: 'PhD in Computer Science, former OpenAI researcher focused on language models.',
      avatar: 'MJ',
      linkedin: '#',
    },
    {
      name: 'Emily Davis',
      role: 'Head of Product',
      bio: 'Former LinkedIn product manager with expertise in career development platforms.',
      avatar: 'ED',
      linkedin: '#',
    },
  ];

  const timeline = [
    {
      year: '2022',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize career development using AI',
      icon: <Rocket />,
    },
    {
      year: '2023',
      title: 'AI Engine Launch',
      description: 'Released BERT-powered resume parsing with 95% accuracy',
      icon: <Psychology />,
    },
    {
      year: '2023',
      title: 'Series A Funding',
      description: 'Raised $10M to accelerate AI development and platform growth',
      icon: <EmojiEvents />,
    },
    {
      year: '2024',
      title: 'Global Expansion',
      description: 'Reached 50,000+ users across 25 countries worldwide',
      icon: <Language />,
    },
  ];

  const values = [
    {
      title: 'AI-First Innovation',
      description: 'We believe artificial intelligence should augment human potential, not replace it.',
      icon: <Psychology />,
      gradient: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
    },
    {
      title: 'Career Empowerment',
      description: 'Every professional deserves access to tools that accelerate their career growth.',
      icon: <TrendingUp />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
    {
      title: 'Data Privacy',
      description: 'Your career data is sacred. We maintain the highest security and privacy standards.',
      icon: <Security />,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
    {
      title: 'Inclusive Growth',
      description: 'We build technology that creates equal opportunities for all professionals.',
      icon: <People />,
      gradient: 'linear-gradient(135deg, #C4A574 0%, #D4BA94 100%)',
    },
  ];

  const achievements = [
    { title: 'Best AI Startup 2023', organization: 'TechCrunch Disrupt' },
    { title: 'Innovation Award', organization: 'HR Tech Conference' },
    { title: 'Top 10 Career Platforms', organization: 'Forbes' },
    { title: 'AI Excellence Award', organization: 'MIT Technology Review' },
  ];

  const technologies = [
    { name: 'BERT & Transformers', progress: 95 },
    { name: 'GPT Integration', progress: 90 },
    { name: 'Machine Learning', progress: 98 },
    { name: 'Natural Language Processing', progress: 92 },
    { name: 'Real-time Processing', progress: 88 },
    { name: 'Cloud Architecture', progress: 94 },
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
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.8rem' },
                  mb: 3,
                  textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                Revolutionizing Careers with AI
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6,
                  mb: 4,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                We're on a mission to democratize career success through cutting-edge
                artificial intelligence, making professional growth accessible to everyone.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    border: '3px solid #FBBF24',
                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5), 0 0 40px rgba(251, 191, 36, 0.4)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      transform: 'translateY(-4px) scale(1.05)',
                      boxShadow: '0 12px 48px rgba(245, 158, 11, 0.7), 0 0 50px rgba(251, 191, 36, 0.6)',
                      borderColor: '#FCD34D',
                    },
                  }}
                >
                  Join Our Mission
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/features')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: alpha('#ffffff', 0.1),
                    },
                  }}
                >
                  Explore Features
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <Psychology sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    AI-Powered Platform
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Built by AI experts for career success
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card className="hover-lift" sx={{ textAlign: 'center', p: 3, borderRadius: 3 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Our Story */}
      <Box sx={{ backgroundColor: '#f8fafc', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
                Our Story
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                CareerConnect AI was born from a simple observation: despite having access to more
                job opportunities than ever before, professionals still struggle to find roles that
                truly match their skills, aspirations, and potential.
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                Our founders, having experienced this challenge firsthand during their careers at
                Google, Microsoft, and LinkedIn, decided to leverage their expertise in artificial
                intelligence to solve this problem at scale.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                Today, we're proud to serve over 50,000 professionals worldwide, helping them
                accelerate their careers through the power of AI-driven insights and recommendations.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                {timeline.map((item, index) => (
                  <Card key={index} className="hover-lift" sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            mr: 2,
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {item.year}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Our Values */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
            Our Values
          </Typography>
          <Typography variant="h6" color="text.secondary">
            The principles that guide everything we do
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {values.map((value, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                className="hover-lift"
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    background: value.gradient,
                  }}
                />
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      background: value.gradient,
                      color: 'white',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    {value.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Team Section */}
      <Box sx={{ backgroundColor: '#f8fafc', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
              Meet Our Team
            </Typography>
            <Typography variant="h6" color="text.secondary">
              World-class experts in AI, machine learning, and career development
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card className="hover-lift" sx={{ textAlign: 'center', p: 3, borderRadius: 3 }}>
                  <Typography sx={{ fontSize: '3.2rem', mb: 2 }}>
                    {member.avatar}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" sx={{ mb: 2, fontWeight: 600 }}>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {member.bio}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Technology Stack */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
              Cutting-Edge Technology
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
              Our platform is built on the latest advances in artificial intelligence and
              machine learning, ensuring you get the most accurate and intelligent career insights.
            </Typography>
            <Stack spacing={3}>
              {technologies.map((tech, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {tech.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tech.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={tech.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                Recognition & Awards
              </Typography>
              <Grid container spacing={3}>
                {achievements.map((achievement, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      className="hover-lift"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '2px solid #f1f5f9',
                      }}
                    >
                      <EmojiEvents sx={{ fontSize: 40, color: '#fbbf24', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.organization}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
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
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.3rem' } }}>
              Ready to Join the AI Career Revolution?
            </Typography>
            <Typography variant="h6" paragraph sx={{ opacity: 0.9, mb: 4, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              Be part of the future of career development. Start your AI-powered journey today.
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
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  border: '3px solid #FBBF24',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5), 0 0 40px rgba(251, 191, 36, 0.4)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: '0 12px 48px rgba(245, 158, 11, 0.7), 0 0 50px rgba(251, 191, 36, 0.6)',
                    borderColor: '#FCD34D',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/features')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 5,
                  py: 2,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  borderWidth: '2px',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: alpha('#ffffff', 0.15),
                    transform: 'translateY(-2px)',
                    borderWidth: '2px',
                  },
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;
