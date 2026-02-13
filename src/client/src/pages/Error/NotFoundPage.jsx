import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowBack, Search, Explore } from '@mui/icons-material';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          className="animate-scale-in"
          sx={{
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '10rem' },
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                lineHeight: 1,
              }}
            >
              404
            </Typography>
            
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              Oops! Page Not Found 😅
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph 
              sx={{ 
                maxWidth: 500,
                mx: 'auto',
                mb: 4,
                fontWeight: 400,
              }}
            >
              The page you're looking for seems to have vanished into the digital void. 
              Don't worry, even the best AI gets lost sometimes!
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{
                  background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6B5544 0%, #4A3F35 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Back to Home
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'rgba(139, 111, 71, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Go Back
              </Button>
            </Stack>

            <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Need help finding what you're looking for?
              </Typography>
              <Stack direction="row" spacing={3} justifyContent="center">
                <Button
                  size="small"
                  startIcon={<Search />}
                  onClick={() => navigate('/jobs/search')}
                  sx={{ color: 'text.secondary' }}
                >
                  Search Jobs
                </Button>
                <Button
                  size="small"
                  startIcon={<Explore />}
                  onClick={() => navigate('/dashboard')}
                  sx={{ color: 'text.secondary' }}
                >
                  Explore Dashboard
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
