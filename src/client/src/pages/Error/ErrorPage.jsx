import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  useTheme
} from '@mui/material';
import { Home, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            maxWidth: 600,
            '& .MuiAlert-message': {
              fontSize: '1.1rem'
            }
          }}
        >
          Something went wrong. Please try again or contact support if the problem persists.
        </Alert>
        
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            mb: 2
          }}
        >
          Oops! Something went wrong
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 500 }}
        >
          We encountered an unexpected error. This might be a temporary issue. 
          Please try refreshing the page or navigating back to the homepage.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ textTransform: 'none' }}
          >
            Refresh Page
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none' }}
          >
            Go Home
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorPage;
