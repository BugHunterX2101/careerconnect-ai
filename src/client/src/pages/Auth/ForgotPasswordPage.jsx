import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6D3 50%, #E8D4B8 100%)',
        p: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(139, 111, 71, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212, 186, 148, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        className="animate-scale-in"
        sx={{
          maxWidth: 550,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(61, 47, 35, 0.3)',
          borderRadius: 5,
          border: '2px solid rgba(139, 111, 71, 0.15)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.98)',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 30px 60px -12px rgba(61, 47, 35, 0.4)',
            transform: 'translateY(-4px)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                fontSize: { xs: '2.1rem', md: '3rem' },
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Forgot Password?
            </Typography>
            <Typography variant="body1" sx={{ fontSize: { xs: '1.05rem', md: '1.15rem' }, color: '#6B5544', fontWeight: 500, lineHeight: 1.6 }}>
              Enter your email to receive a password reset link
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                fontSize: '1.05rem',
                py: 2,
                borderRadius: 3,
                '& .MuiAlert-icon': {
                  fontSize: '1.7rem',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 4,
                  fontSize: '1.05rem',
                  py: 2,
                  borderRadius: 3,
                  '& .MuiAlert-icon': {
                    fontSize: '1.7rem',
                  },
                }}
              >
                Password reset email sent! Check your inbox.
              </Alert>
              <Link 
                component={RouterLink} 
                to="/login" 
                sx={{ 
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#8B6F47',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#6B5544',
                    textDecoration: 'underline',
                  },
                }}
              >
                Back to Login
              </Link>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 4 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#8B6F47', fontSize: 28 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 4,
                  py: 2.5,
                  textTransform: 'none',
                  fontSize: { xs: '1.15rem', md: '1.05rem' },
                  fontWeight: 700,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                  boxShadow: '0 10px 25px rgba(139, 111, 71, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6B5544 0%, #4A3F35 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 35px rgba(139, 111, 71, 0.4)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #D4BA94 0%, #B89968 100%)',
                    opacity: 0.6,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={28} color="inherit" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontSize: '1.05rem', color: '#6B5544' }}>
              Remember your password?{' '}
              <Link 
                component={RouterLink} 
                to="/login" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: '#8B6F47',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#6B5544',
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;

