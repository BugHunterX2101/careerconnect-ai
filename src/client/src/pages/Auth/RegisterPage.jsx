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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Business,
  Work,
  Google,
  LinkedIn,
  GitHub
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register, loginWithToken } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleLinkedInSignup = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/linkedin`;
  };

  const handleGitHubSignup = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/github`;
  };

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
        window.history.replaceState({}, document.title, '/register');
        return;
      }

      if (oauth === 'success' && token) {
        setLoading(true);
        const result = await loginWithToken(token);
        
        if (result.success) {
          // Clean up URL before navigating
          window.history.replaceState({}, document.title, '/register');
          navigate('/dashboard', { replace: true });
        } else {
          setError('Authentication failed. Please try again.');
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [loginWithToken, navigate]);

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
      <Card
        className="animate-scale-in"
        sx={{
          maxWidth: 650,
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
        <CardContent sx={{ p: { xs: 5, md: 7 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
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
              Join CareerConnect AI 🚀
            </Typography>
            <Typography variant="body1" sx={{ fontSize: { xs: '1.125rem', md: '1.375rem' }, color: '#6B5544', fontWeight: 500, lineHeight: 1.5 }}>
              Start your AI-powered career journey today
            </Typography>
          </Box>

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

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3.5 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#8B6F47', fontSize: 28 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Box>
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

            <FormControl fullWidth sx={{ mb: 3.5 }}>
              <InputLabel>{t('register.roleLabel')}</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label={t('register.roleLabel')}
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    {formData.role === 'employer' ? <Business sx={{ color: '#8B6F47', fontSize: 28 }} /> : <Work sx={{ color: '#8B6F47', fontSize: 28 }} />}
                  </InputAdornment>
                }
              >
                <MenuItem value="jobseeker">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Work sx={{ mr: 1 }} />
                    {t('register.jobSeeker')}
                  </Box>
                </MenuItem>
                <MenuItem value="employer">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ mr: 1 }} />
                    {t('register.employer')}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 3.5 }}
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

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{ mb: 3.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#8B6F47', fontSize: 28 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: '#8B6F47' }}
                    >
                      {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 28 }} /> : <Visibility sx={{ fontSize: 28 }} />}
                    </IconButton>
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
                fontSize: { xs: '1.25rem', md: '1.5rem' },
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
                'Create My Account'
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

          {/* Social Signup Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google sx={{ fontSize: 26 }} />}
              onClick={handleGoogleSignup}
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
              onClick={handleLinkedInSignup}
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
              onClick={handleGitHubSignup}
              sx={{
                py: 2,
                textTransform: 'none',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#3D2F23',
                color: '#3D2F23',
                borderWidth: 2,
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

          {/* Terms */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" sx={{ fontSize: '1rem', color: '#6B5544', lineHeight: 1.6 }}>
              By creating an account, you agree to our{' '}
              <Link href="#" sx={{ color: '#8B6F47', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="#" sx={{ color: '#8B6F47', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Privacy Policy
              </Link>
            </Typography>
          </Box>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontSize: '1.125rem', color: '#6B5544' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#8B6F47',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#6B5544',
                  },
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
