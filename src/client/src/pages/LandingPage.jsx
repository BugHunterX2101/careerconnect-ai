import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  Avatar,
  Chip,
  Stack,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  alpha,
} from '@mui/material'
import {
  Description,
  Work,
  TrendingUp,
  Security,
  Speed,
  Analytics,
  AutoAwesome,
  Rocket,
  Psychology,
  LinkedIn,
  GitHub,
  Google,
  ArrowForward,
  PlayArrow,
  Star,
  CheckCircle,
  Menu,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [visibleCards, setVisibleCards] = useState(new Set())

  const features = [
    {
      icon: <Psychology sx={{ fontSize: 48 }} />,
      title: 'AI-Powered Resume Analysis',
      description: 'Advanced BERT-based parsing with intelligent skill extraction, gap analysis, and improvement suggestions.',
      gradient: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
      badge: 'BERT Engine',
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 48 }} />,
      title: 'Smart Job Matching',
      description: 'Machine learning algorithms that understand your career goals and match you with perfect opportunities.',
      gradient: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
      badge: 'ML Powered',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      title: 'Career Intelligence',
      description: 'Real-time market insights, salary predictions, and personalized career roadmaps powered by AI.',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      badge: 'Data Driven',
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: 'Enterprise Security',
      description: 'Bank-level security with OAuth 2.0, end-to-end encryption, and GDPR compliance.',
      gradient: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
      badge: 'Secure',
    },
    {
      icon: <Speed sx={{ fontSize: 48 }} />,
      title: 'Lightning Fast',
      description: 'Real-time processing with instant notifications, live chat, and seamless video interviews.',
      gradient: 'linear-gradient(135deg, #3A5A8C 0%, #4B7DBE 100%)',
      badge: 'Real-time',
    },
    {
      icon: <Analytics sx={{ fontSize: 48 }} />,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards with actionable insights for both job seekers and employers.',
      gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
      badge: 'Insights',
    },
  ]

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '10K+', label: 'Jobs Posted' },
    { number: '95%', label: 'Match Accuracy' },
    { number: '24/7', label: 'AI Support' },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      content: 'CareerConnect\'s AI helped me land my dream job at Google. The resume analysis was incredibly detailed!',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager',
      company: 'Microsoft',
      content: 'The job matching algorithm is phenomenal. Found the perfect role that aligned with my career goals.',
      avatar: 'MR',
    },
    {
      name: 'Emily Johnson',
      role: 'Data Scientist',
      company: 'Netflix',
      content: 'The career insights and market analysis helped me negotiate a 40% salary increase!',
      avatar: 'EJ',
    },
  ]

  return (
    <Box sx={{ 
      backgroundColor: '#F9FAFB',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 10% 20%, rgba(58, 90, 140, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(13, 148, 136, 0.03) 0%, transparent 40%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      {/* Navigation */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: scrolled ? alpha('#ffffff', 0.98) : 'rgba(58, 90, 140, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'background-color, border-color',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 80, md: 96 }, py: 1.5, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <Typography
            variant="h4"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: scrolled ? 'transparent' : 'white',
              background: scrolled 
                ? 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)' 
                : 'none',
              WebkitBackgroundClip: scrolled ? 'text' : 'unset',
              WebkitTextFillColor: scrolled ? 'transparent' : 'white',
              textShadow: scrolled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.3)',
              transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s cubic-bezier(0.4, 0, 0.2, 1), text-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'color, background',
            }}
          >
            CareerConnect AI
          </Typography>
          <Stack direction="row" spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/features')}
              sx={{ 
                color: scrolled ? 'text.primary' : 'white',
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                py: 1.25,
                textShadow: scrolled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Features
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/pricing')}
              sx={{ 
                color: scrolled ? 'text.primary' : 'white',
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                py: 1.25,
                textShadow: scrolled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Pricing
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/about')}
              sx={{ 
                color: scrolled ? 'text.primary' : 'white',
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                py: 1.25,
                textShadow: scrolled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              About
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: scrolled ? 'primary.main' : 'white',
                color: scrolled ? 'primary.main' : 'white',
                borderWidth: 2,
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 3,
                py: 1.25,
                textShadow: scrolled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: scrolled 
                    ? alpha('#3A5A8C', 0.1) 
                    : alpha('#ffffff', 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Sign In
            </Button>
            <Button 
              variant="contained" 
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.15rem',
                px: 5,
                py: 1.75,
                border: '3px solid #14B8A6',
                boxShadow: '0 4px 16px rgba(13, 148, 136, 0.4), 0 0 20px rgba(20, 184, 166, 0.3)',
                animation: 'subtleGlow 2s ease-in-out infinite',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: '0 8px 24px rgba(13, 148, 136, 0.6), 0 0 30px rgba(20, 184, 166, 0.5)',
                  borderColor: '#2DD4BF',
                },
              }}
            >
              Start Free Trial
            </Button>
          </Stack>
          <IconButton 
            sx={{ 
              display: { xs: 'block', md: 'none' },
              color: scrolled ? 'text.primary' : 'white',
              backgroundColor: alpha('#ffffff', scrolled ? 0.1 : 0.2),
              width: 56,
              height: 56,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha('#ffffff', scrolled ? 0.2 : 0.3),
                transform: 'rotate(90deg) scale(1.1)',
              },
            }}
          >
            <Menu sx={{ fontSize: 32, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
          color: 'white',
          pt: { xs: 16, md: 20 },
          pb: { xs: 10, md: 14 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 10% 20%, rgba(58, 90, 140, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(13, 148, 136, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 60%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '120%',
            height: '120%',
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box className="animate-fade-in">
                <Chip
                  label="Powered by Advanced AI"
                  sx={{
                    mb: 3,
                    backgroundColor: alpha('#ffffff', 0.2),
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
                <Typography
                  variant="h1"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem', lg: '4.4rem' },
                    lineHeight: 1.1,
                    mb: 4,
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Transform Your Career with{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -8,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: 'linear-gradient(90deg, #14B8A6, #0D9488)',
                        borderRadius: 2,
                        opacity: 0.7,
                      },
                    }}
                  >
                    AI Intelligence
                  </Box>
                </Typography>
                <Typography
                  variant="h5"
                  paragraph
                  sx={{
                    opacity: 0.95,
                    fontWeight: 400,
                    lineHeight: 1.8,
                    mb: 5,
                    fontSize: { xs: '1rem', md: '1.12rem', lg: '1.18rem' },
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  Experience the future of job searching with{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: '#14B8A6' }}>
                    BERT-powered resume analysis
                  </Box>
                  , intelligent job matching, and real-time career insights that help you land
                  your dream role{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: '#10B981' }}>
                    3x faster
                  </Box>
                  .
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/register')}
                    sx={{
                      background: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
                      color: 'white',
                      px: 6,
                      py: 2.5,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      border: '3px solid #14B8A6',
                      boxShadow: '0 8px 32px rgba(13, 148, 136, 0.5), 0 0 40px rgba(20, 184, 166, 0.4)',
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                        transform: 'translateY(-4px) scale(1.05)',
                        boxShadow: '0 12px 48px rgba(13, 148, 136, 0.7), 0 0 50px rgba(20, 184, 166, 0.6)',
                        borderColor: '#2DD4BF',
                      },
                    }}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      px: 5,
                      py: 2,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      borderWidth: 2,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: 'white',
                        borderWidth: 2,
                        backgroundColor: alpha('#ffffff', 0.15),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 2, fontSize: '0.95rem' }}>
                    Trusted by professionals at:
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                      <Google sx={{ mr: 1, fontSize: 24 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Google</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                      <LinkedIn sx={{ mr: 1, fontSize: 24 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>LinkedIn</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                      <GitHub sx={{ mr: 1, fontSize: 24 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>GitHub</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                className="animate-slide-up"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: { xs: 400, md: 600 },
                  position: 'relative',
                }}
              >
                {/* Animated Background Elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      opacity: 0.2,
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '20%',
                      right: '15%',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
                      opacity: 0.3,
                    },
                  }}
                />
                
                {/* Main Logo Container */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 6,
                    background: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(30px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #3A5A8C, #0D9488, #14B8A6, #3A5A8C)',
                      backgroundSize: '400% 100%',
                    },
                  }}
                >
                  {/* Animated Logo Stack */}
                  <Stack spacing={3} alignItems="center">
                    {/* Main AI Brain Icon */}
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
                          boxShadow: '0 20px 40px rgba(58, 90, 140, 0.4)',
                        }}
                      >
                        <Psychology sx={{ fontSize: 60, color: 'white' }} />
                      </Avatar>
                      
                      {/* Orbiting Elements */}
                      <Box
                        sx={{
                          position: 'absolute',
                          width: 200,
                          height: 200,
                          borderRadius: '50%',
                          border: '2px dashed rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Avatar
                          sx={{
                            position: 'absolute',
                            top: -20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                          }}
                        >
                          <Work sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Avatar
                          sx={{
                            position: 'absolute',
                            bottom: -20,
                            right: '50%',
                            transform: 'translateX(50%)',
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
                          }}
                        >
                          <TrendingUp sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Avatar
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            right: -20,
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
                          }}
                        >
                          <Analytics sx={{ fontSize: 20 }} />
                        </Avatar>
                      </Box>
                    </Box>
                    
                    {/* Logo Text */}
                    <Box>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 900, 
                          mb: 1,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        CareerConnect
                      </Typography>
                      <Chip
                        label="AI POWERED"
                        sx={{
                          background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          letterSpacing: 1,
                          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)',
                        }}
                      />
                    </Box>
                    
                    {/* Feature Icons */}
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: alpha('#ffffff', 0.2),
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <AutoAwesome sx={{ color: '#14B8A6' }} />
                      </Avatar>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: alpha('#ffffff', 0.2),
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Rocket sx={{ color: '#3A5A8C' }} />
                      </Avatar>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: alpha('#ffffff', 0.2),
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Security sx={{ color: '#0D9488' }} />
                      </Avatar>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 10, md: 14 } }}>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box 
                textAlign="center" 
                className="animate-scale-in"
                sx={{
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.8s ease-out ${index * 0.1}s both`,
                  '&:hover': {
                    transform: 'translateY(-10px) scale(1.05)',
                  },
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '3.2rem', md: '5.5rem', lg: '6.5rem' },
                    background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.75rem' } }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ 
        backgroundColor: '#F9FAFB', 
        py: { xs: 12, md: 16 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '15%',
          left: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(58, 90, 140, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="xl">
          <Box textAlign="center" sx={{ mb: { xs: 8, md: 12 } }}>
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '3.5rem', md: '5rem' },
                background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                letterSpacing: '-0.02em',
              }}
            >
              Why Choose CareerConnect AI?
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ maxWidth: 900, mx: 'auto', fontWeight: 400, fontSize: { xs: '1.05rem', md: '1.7rem' }, lineHeight: 1.7 }}
            >
              Built with cutting-edge artificial intelligence to revolutionize how you
              discover, apply, and succeed in your career journey.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 3, md: 4 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  className="hover-lift"
                  sx={{
                    height: '100%',
                    border: 'none',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `slideUp 0.6s ease-out ${index * 0.1}s both`,
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 20px 60px rgba(58, 90, 140, 0.25)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 6,
                      background: feature.gradient,
                      backgroundSize: '200% 200%',
                    }}
                  />
                  <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: { xs: 56, md: 72 },
                          height: { xs: 56, md: 72 },
                          background: feature.gradient,
                          color: 'white',
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Chip
                        label={feature.badge}
                        size="small"
                        sx={{
                          background: feature.gradient,
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          height: 24,
                        }}
                      />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.6rem' }, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="xl" sx={{ 
        py: { xs: 12, md: 16 },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(58, 90, 140, 0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        },
      }}>
        <Box textAlign="center" sx={{ mb: { xs: 8, md: 12 } }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3.1rem' }, letterSpacing: '-0.02em' }}>
            Success Stories
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ fontSize: { xs: '1.05rem', md: '1.35rem' }, fontWeight: 500, lineHeight: 1.6 }}>
            See how CareerConnect AI has transformed careers worldwide
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                className="hover-lift"
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: '2px solid',
                   borderColor: 'rgba(13, 148, 136, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `fadeIn 0.8s ease-out ${index * 0.15}s both`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                     borderColor: 'rgba(13, 148, 136, 0.5)',
                     boxShadow: '0 16px 48px rgba(13, 148, 136, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', mb: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                       sx={{
                         color: '#0D9488',
                        fontSize: 28,
                      }} 
                    />
                  ))}
                </Box>
                <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.8 }}>
                  "{testimonial.content}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
                    {testimonial.avatar}
                  </Typography>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
                      {testimonial.role} at {testimonial.company}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
           background: 'linear-gradient(135deg, #3A5A8C 0%, #2F4A73 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
             background: 'radial-gradient(circle at 30% 50%, rgba(13, 148, 136, 0.2) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(20, 184, 166, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3rem' }, mb: 3 }}>
              Ready to Accelerate Your Career?
            </Typography>
            <Typography
              variant="h5"
              paragraph
              sx={{ opacity: 0.95, mb: 5, fontWeight: 400, fontSize: { xs: '1.05rem', md: '1.25rem' }, lineHeight: 1.7 }}
            >
              Join over 50,000 professionals who have already transformed their careers
              with CareerConnect AI. Start your free trial today.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                   background: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
                  color: 'white',
                  px: 6,
                  py: 2.5,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: 3,
                   border: '3px solid #14B8A6',
                   boxShadow: '0 8px 32px rgba(13, 148, 136, 0.5), 0 0 40px rgba(20, 184, 166, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                     background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                    transform: 'translateY(-4px) scale(1.05)',
                     boxShadow: '0 12px 48px rgba(13, 148, 136, 0.7), 0 0 50px rgba(20, 184, 166, 0.6)',
                     borderColor: '#2DD4BF',
                  },
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 6,
                  py: 2.5,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  borderWidth: 3,
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: 'white',
                    borderWidth: 3,
                    backgroundColor: alpha('#ffffff', 0.15),
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                Contact Sales
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <CheckCircle sx={{ color: '#34d399', fontSize: 32 }} />
              <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.98rem', fontWeight: 500 }}>
                No credit card required • 14-day free trial • Cancel anytime
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        backgroundColor: '#0f172a', 
        color: 'white', 
        py: { xs: 8, md: 10 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
           background: 'radial-gradient(circle at 20% 50%, rgba(13, 148, 136, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(58, 90, 140, 0.06) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={5}>
            <Grid item xs={12} md={4}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.35rem', md: '1.55rem' },
                   background: 'linear-gradient(135deg, #0D9488 0%, #3A5A8C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2.5,
                  letterSpacing: '-0.02em',
                }}
              >
                CareerConnect AI
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 3, fontSize: { xs: '1.05rem', md: '1.05rem' }, lineHeight: 1.7, fontWeight: 400 }}>
                Transforming careers with artificial intelligence and machine learning.
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton 
                  sx={{ 
                    color: 'white', 
                    p: 1.5,
                    backgroundColor: 'rgba(139, 111, 71, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 111, 71, 0.4)',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <LinkedIn sx={{ fontSize: 28 }} />
                </IconButton>
                <IconButton 
                  sx={{ 
                    color: 'white', 
                    p: 1.5,
                    backgroundColor: 'rgba(139, 111, 71, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 111, 71, 0.4)',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <GitHub sx={{ fontSize: 28 }} />
                </IconButton>
                <IconButton 
                  sx={{ 
                    color: 'white', 
                    p: 1.5,
                    backgroundColor: 'rgba(139, 111, 71, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 111, 71, 0.4)',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Google sx={{ fontSize: 28 }} />
                </IconButton>
              </Stack>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={4}>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 2.5, color: '#D4BA94' }}>
                    Product
                  </Typography>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Features</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Pricing</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>API</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 2.5, color: '#D4BA94' }}>
                    Company
                  </Typography>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>About</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Careers</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Contact</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 2.5, color: '#D4BA94' }}>
                    Resources
                  </Typography>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Blog</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Help Center</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Community</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 2.5, color: '#D4BA94' }}>
                    Legal
                  </Typography>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Privacy</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Terms</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1rem' }, cursor: 'pointer', '&:hover': { opacity: 1, color: '#D4BA94', transform: 'translateX(5px)' }, transition: 'all 0.3s ease' }}>Security</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '2px solid rgba(139, 111, 71, 0.3)', mt: 6, pt: 5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.75, fontSize: { xs: '0.92rem', md: '0.95rem' }, fontWeight: 400, letterSpacing: '0.01em' }}>
              © 2024 CareerConnect AI. All rights reserved. Built for career success.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage

