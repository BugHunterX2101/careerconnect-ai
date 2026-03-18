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
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
  Slide,
  Stack,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  LinkedIn,
  GitHub,
  WorkOutline,
  CheckCircleOutline,
  VerifiedUser,
  Insights
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useOAuthFlow from '../../hooks/useOAuthFlow';
import { CalmAlert } from '../../components/common';

const LoginPage = () => {
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
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/dashboard';

  const { oauthState, statusFlags, startOAuth, retryOAuth } = useOAuthFlow({
    loginWithToken,
    navigate,
    fallbackPath: from
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateLoginForm = () => {
    const nextErrors = { email: '', password: '' };

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) {
      return;
    }
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

  const handleGoogleLogin = () => startOAuth('google');
  const handleLinkedInLogin = () => startOAuth('linkedin');
  const handleGitHubLogin = () => startOAuth('github');

  const displayError = error || (statusFlags.hasError ? oauthState.message : '');
  const isOAuthInProgress = statusFlags.isLoading;
  const trustPoints = [
    { icon: <VerifiedUser />, text: 'Enterprise-grade security and compliant OAuth flow' },
    { icon: <Insights />, text: 'AI-driven job insights and personalized recommendations' },
    { icon: <CheckCircleOutline />, text: 'Used by recruiters and candidates in one workspace' }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        position: 'relative',
      }}
    >
      <Box className="auth-mesh" />
      <Fade in timeout={700}>
        <Grid className="auth-editorial-shell motion-page-enter" sx={{ width: '100%', maxWidth: 1200 }}>
          <Box className="auth-trust-panel">
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.82)', mb: 1, display: 'block' }}>
              CareerConnect AI
            </Typography>
            <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
              A smarter way to navigate careers.
            </Typography>
            <Typography sx={{ color: 'rgba(245, 249, 255, 0.88)', fontSize: '1rem', mb: 4, maxWidth: 500 }}>
              Sign in to access hiring intelligence, role-fit analytics, and a unified collaboration workspace for candidates and employers.
            </Typography>
            <List className="stagger-group" sx={{ '& .MuiListItem-root': { px: 0 } }}>
              {trustPoints.map((point) => (
                <ListItem key={point.text}>
                  <ListItemIcon sx={{ color: '#e9f2ff', minWidth: 34 }}>{point.icon}</ListItemIcon>
                  <ListItemText primary={point.text} primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.92)', fontWeight: 500 } }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Card className="signature-card" sx={{ width: '100%', borderRadius: 4, position: 'relative', zIndex: 1 }}>
            <CardContent sx={{ p: { xs: 3.5, md: 5 } }}>
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
                  fontWeight: 700, 
                  mb: 2,
                  fontSize: { xs: '1.9rem', md: '2.3rem' },
                  background: 'linear-gradient(135deg, #0F5FCC 0%, #1F73F2 70%, #F57A2E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                CareerConnect
              </Typography>
              <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, color: 'text.secondary', fontWeight: 500, lineHeight: 1.5 }}>
                Sign in to your professional dashboard
              </Typography>
            </Box>
          </Slide>

          {/* Error Alert */}
          {displayError && (
            <CalmAlert
              className="field-error-shake"
              severity="error" 
              sx={{ 
                mb: 4,
                fontSize: '1rem',
                py: 2,
                borderRadius: 3,
                '& .MuiAlert-icon': {
                  fontSize: '1.05rem',
                },
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography component="span" sx={{ fontSize: 'inherit' }}>{displayError}</Typography>
                {statusFlags.hasError && oauthState.provider && (
                  <Button size="small" onClick={() => retryOAuth(oauthState.provider)} sx={{ minWidth: 96 }}>
                    Retry
                  </Button>
                )}
              </Stack>
            </CalmAlert>
          )}

          {statusFlags.isLoading && oauthState.message && (
            <CalmAlert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              {oauthState.message}
            </CalmAlert>
          )}

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              '& .MuiInputBase-root': { minHeight: { xs: 50, sm: 56 } },
              '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: { xs: 22, sm: 26 } }
            }}
          >
            <TextField
              className={fieldErrors.email ? 'field-error-shake' : formData.email ? 'field-success-pop' : ''}
              fullWidth
              label={t('email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email || 'Use your work or primary account email.'}
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
              className={fieldErrors.password ? 'field-error-shake' : formData.password ? 'field-success-pop' : ''}
              fullWidth
              label={t('password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Minimum 8 characters recommended for account safety.'}
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
                fontSize: '1rem',
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
              disabled={loading || isOAuthInProgress}
              sx={{
                mb: 4,
                py: 2.5,
                textTransform: 'none',
                fontSize: { xs: '1.05rem', md: '1.05rem' },
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
            <Typography variant="body2" sx={{ px: 3, fontSize: '1rem', color: '#8B6F47', fontWeight: 600 }}>
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
              disabled={isOAuthInProgress}
              sx={{
                py: { xs: 1.35, sm: 1.8 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#c4d2e1',
                color: '#db4437',
                borderWidth: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0F5FCC',
                  backgroundColor: 'rgba(219, 68, 55, 0.1)',
                  borderWidth: 1,
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
              disabled={isOAuthInProgress}
              sx={{
                py: { xs: 1.35, sm: 1.8 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#c4d2e1',
                color: '#0077b5',
                borderWidth: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0F5FCC',
                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                  borderWidth: 1,
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
              disabled={isOAuthInProgress}
              sx={{
                py: { xs: 1.35, sm: 1.8 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#c4d2e1',
                color: '#1B2B3B',
                borderWidth: 1,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0F5FCC',
                  backgroundColor: 'rgba(61, 47, 35, 0.1)',
                  borderWidth: 1,
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
            <Typography variant="body2" sx={{ fontSize: '1rem', color: '#6B5544' }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.05rem',
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
        </Grid>
      </Fade>
    </Box>
  );
};

export default LoginPage;

