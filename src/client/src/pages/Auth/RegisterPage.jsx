import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  GitHub,
  CheckCircleOutline,
  Bolt,
  Security
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useOAuthFlow from '../../hooks/useOAuthFlow';
import { CalmAlert } from '../../components/common';

const RegisterPage = () => {
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
  const [fieldErrors, setFieldErrors] = useState({});

  const { oauthState, statusFlags, startOAuth, retryOAuth } = useOAuthFlow({
    loginWithToken,
    navigate,
    fallbackPath: '/dashboard'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix the highlighted fields and try again.');
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

  const handleGoogleSignup = () => startOAuth('google', 'register');
  const handleLinkedInSignup = () => startOAuth('linkedin', 'register');
  const handleGitHubSignup = () => startOAuth('github', 'register');

  const displayError = error || (statusFlags.hasError ? oauthState.message : '');
  const isOAuthInProgress = statusFlags.isLoading;
  const trustPoints = [
    { icon: <Security />, text: 'Protected authentication and privacy-first profile handling' },
    { icon: <Bolt />, text: 'Fast AI resume parsing and instant career signal analysis' },
    { icon: <CheckCircleOutline />, text: 'One account for hiring, applying, and interview workflow' }
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
      <Grid className="auth-editorial-shell motion-page-enter" sx={{ width: '100%', maxWidth: 1200 }}>
        <Box className="auth-trust-panel" sx={{ order: { xs: 2, lg: 1 } }}>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.82)', mb: 1, display: 'block' }}>
            Join CareerConnect AI
          </Typography>
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Build your advantage from day one.
          </Typography>
          <Typography sx={{ color: 'rgba(245, 249, 255, 0.9)', mb: 4 }}>
            Create your workspace, connect your profile, and get a professionally guided path through opportunities and talent.
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

        <Card className="signature-card" sx={{ width: '100%', borderRadius: 4, order: { xs: 1, lg: 2 } }}>
          <CardContent sx={{ p: { xs: 3.5, md: 5 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                fontSize: { xs: '1.9rem', md: '2.25rem' },
                background: 'linear-gradient(135deg, #0F5FCC 0%, #1F73F2 70%, #F57A2E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Join CareerConnect AI
            </Typography>
            <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, color: 'text.secondary', fontWeight: 500, lineHeight: 1.5 }}>
              Start your AI-powered career journey today
            </Typography>
          </Box>

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

          {/* Registration Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              '& .MuiInputBase-root': { minHeight: { xs: 50, sm: 56 } },
              '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: { xs: 22, sm: 26 } }
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, mb: 3.5 }}>
              <TextField
                className={fieldErrors.firstName ? 'field-error-shake' : formData.firstName ? 'field-success-pop' : ''}
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
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
                className={fieldErrors.lastName ? 'field-error-shake' : formData.lastName ? 'field-success-pop' : ''}
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
                required
              />
            </Box>
            <TextField
              className={fieldErrors.email ? 'field-error-shake' : formData.email ? 'field-success-pop' : ''}
              fullWidth
              label={t('email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email || 'We use this for account security and notifications.'}
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
              className={fieldErrors.password ? 'field-error-shake' : formData.password ? 'field-success-pop' : ''}
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Use 8+ characters with a mix of letters and numbers.'}
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
              className={fieldErrors.confirmPassword ? 'field-error-shake' : formData.confirmPassword ? 'field-success-pop' : ''}
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
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
              disabled={loading || isOAuthInProgress}
              sx={{
                mb: 4,
                py: 2.5,
                textTransform: 'none',
                fontSize: { xs: '1.05rem', md: '1.05rem' },
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
            <Typography variant="body2" sx={{ px: 3, fontSize: '1rem', color: '#8B6F47', fontWeight: 600 }}>
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
              onClick={handleLinkedInSignup}
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
              onClick={handleGitHubSignup}
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
            <Typography variant="body2" sx={{ fontSize: '1rem', color: '#6B5544' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.05rem',
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
      </Grid>
    </Box>
  );
};

export default RegisterPage;

