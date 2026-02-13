import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  Divider,
  useTheme,
  Fade,
  Slide
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  LinkedIn,
  GitHub,
  WorkOutline
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithToken } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  // Handle OAuth callback
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const oauth = params.get('oauth');
      const oauthError = params.get('error');
      const provider = params.get('provider');

      if (oauthError) {
        setError(`${provider || 'OAuth'} authentication failed. Please try again.`);
        // Clean up URL
        window.history.replaceState({}, document.title, '/login');
        return;
      }

      if (oauth === 'success' && token) {
        setLoading(true);
        const result = await loginWithToken(token);
        
        if (result.success) {
          // Clean up URL before navigating
          window.history.replaceState({}, document.title, '/login');
          navigate(from, { replace: true });
        } else {
          setError('Authentication failed. Please try again.');
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [loginWithToken, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  const handleLinkedInLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/linkedin`;
  };

  const handleGitHubLogin = () => {
    console.log('GitHub button clicked');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const githubUrl = `${apiUrl}/api/auth/github`;
    console.log('Redirecting to:', githubUrl);
    try {
      window.location.href = githubUrl;
    } catch (error) {
      console.error('Redirect failed:', error);
      window.open(githubUrl, '_self');
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
          animation: 'gentleWave 15s ease-in-out infinite',
          pointerEvents: 'none',
        },
      }}
    >
      <Fade in timeout={800}>
        <Card
          sx={{
            maxWidth: 650,
            width: '100%',
            boxShadow: '0 32px 64px -12px rgba(61, 47, 35, 0.3)',
            borderRadius: 5,
            border: '2px solid rgba(139, 111, 71, 0.15)',
            backdropFilter: 'blur(24px)',
            background: 'rgba(255, 255, 255, 0.98)',
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 40px 80px -12px rgba(61, 47, 35, 0.4)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
          {/* Header */}
          <Slide direction="down" in timeout={600}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              {/* Logo */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 40px rgba(139, 111, 71, 0.3)',
                  }}
                >
                  <WorkOutline sx={{ fontSize: 44, color: 'white' }} />
                </Box>
              </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 2,
                  fontSize: { xs: '2.25rem', md: '2.75rem' },
                  background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                CareerConnect
              </Typography>
              <Typography variant="body1" sx={{ fontSize: { xs: '1.125rem', md: '1.375rem' }, color: '#6B5544', fontWeight: 600, lineHeight: 1.5 }}>
                Sign in to your professional dashboard
              </Typography>
            </Box>
          </Slide>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                fontSize: '1.125rem',
                py: 2,
                borderRadius: 3,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#8B6F47', fontSize: 28 }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={t('password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#8B6F47', fontSize: 28 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#8B6F47' }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 28 }} /> : <Visibility sx={{ fontSize: 28 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              sx={{ 
                display: 'block', 
                mb: 3.5,
                fontSize: '1.125rem',
                color: '#8B6F47',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                textAlign: 'right',
                '&:hover': {
                  color: '#6B5544',
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot your password?
            </Link>

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
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                boxShadow: '0 10px 25px rgba(139, 111, 71, 0.3)',
                borderRadius: 3,
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
                'Sign In to Dashboard'
              )}
            </Button>
          </Box>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Divider sx={{ flex: 1, borderColor: 'rgba(139, 111, 71, 0.3)' }} />
            <Typography variant="body2" sx={{ px: 3, fontSize: '1.125rem', color: '#8B6F47', fontWeight: 600 }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1, borderColor: 'rgba(139, 111, 71, 0.3)' }} />
          </Box>

          {/* Social Login Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google sx={{ fontSize: 26 }} />}
              onClick={handleGoogleLogin}
              sx={{
                py: 2,
                textTransform: 'none',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#db4437',
                color: '#db4437',
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#db4437',
                  backgroundColor: 'rgba(219, 68, 55, 0.1)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(219, 68, 55, 0.2)',
                }
              }}
            >
              Continue with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LinkedIn sx={{ fontSize: 26 }} />}
              onClick={handleLinkedInLogin}
              sx={{
                py: 2,
                textTransform: 'none',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#0077b5',
                color: '#0077b5',
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0077b5',
                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0, 119, 181, 0.2)',
                }
              }}
            >
              Continue with LinkedIn
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHub sx={{ fontSize: 26 }} />}
              onClick={handleGitHubLogin}
              sx={{
                py: 2,
                textTransform: 'none',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#3D2F23',
                color: '#3D2F23',
                borderWidth: 2,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#3D2F23',
                  backgroundColor: 'rgba(61, 47, 35, 0.1)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(61, 47, 35, 0.2)',
                }
              }}
            >
              Continue with GitHub
            </Button>
          </Box>

          {/* Links */}
          <Box sx={{ textAlign: 'center' }}>            
            <Typography variant="body2" sx={{ fontSize: '1.125rem', color: '#6B5544' }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#8B6F47',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#6B5544',
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up for free
              </Link>
            </Typography>
          </Box>
        </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default LoginPage;
