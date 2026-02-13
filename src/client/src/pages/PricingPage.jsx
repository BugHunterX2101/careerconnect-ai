import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Rocket,
  Business,
  Psychology,
  TrendingUp,
  Security,
  Support,
  Analytics,
  Speed,
  ArrowForward,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: <Rocket />,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for job seekers starting their AI-powered career journey',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      popular: false,
      features: [
        'AI Resume Analysis (5 per month)',
        'Basic Job Recommendations',
        'Profile Creation & Management',
        'Standard Support',
        'Mobile App Access',
        'Basic Analytics Dashboard'
      ],
      limitations: [
        'Limited to 5 job applications per month',
        'Basic matching algorithm',
        'No video interview features'
      ]
    },
    {
      name: 'Professional',
      icon: <Star />,
      price: { monthly: 29, annual: 290 },
      description: 'Advanced AI features for serious career advancement',
      gradient: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
      popular: true,
      features: [
        'Unlimited AI Resume Analysis',
        'Advanced GPT Job Matching',
        'Career Intelligence & Insights',
        'Real-time Chat & Messaging',
        'Video Interview System',
        'LinkedIn Integration',
        'Priority Support',
        'Advanced Analytics',
        'Salary Prediction Tools',
        'Skill Gap Analysis',
        'Career Path Recommendations',
        'ATS Optimization'
      ],
      limitations: []
    },
    {
      name: 'Enterprise',
      icon: <Business />,
      price: { monthly: 99, annual: 990 },
      description: 'Complete solution for employers and recruitment teams',
      gradient: 'linear-gradient(135deg, #C4A574 0%, #D4BA94 100%)',
      popular: false,
      features: [
        'Everything in Professional',
        'Unlimited Job Postings',
        'AI Candidate Matching (15+ per job)',
        'Bulk Resume Processing',
        'Team Collaboration Tools',
        'Custom Branding',
        'API Access',
        'Advanced Reporting',
        'Dedicated Account Manager',
        'Custom Integrations',
        'White-label Solutions',
        'SLA Guarantee'
      ],
      limitations: []
    }
  ];

  const features = [
    {
      category: 'AI & Machine Learning',
      icon: <Psychology />,
      items: [
        { name: 'BERT Resume Parsing', starter: true, pro: true, enterprise: true },
        { name: 'GPT Job Recommendations', starter: false, pro: true, enterprise: true },
        { name: 'Advanced Candidate Matching', starter: false, pro: true, enterprise: true },
        { name: 'Career Intelligence', starter: false, pro: true, enterprise: true },
        { name: 'Salary Predictions', starter: false, pro: true, enterprise: true },
      ]
    },
    {
      category: 'Communication & Collaboration',
      icon: <Support />,
      items: [
        { name: 'Real-time Chat', starter: false, pro: true, enterprise: true },
        { name: 'Video Interviews', starter: false, pro: true, enterprise: true },
        { name: 'File Sharing', starter: false, pro: true, enterprise: true },
        { name: 'Team Collaboration', starter: false, pro: false, enterprise: true },
        { name: 'Custom Branding', starter: false, pro: false, enterprise: true },
      ]
    },
    {
      category: 'Analytics & Insights',
      icon: <Analytics />,
      items: [
        { name: 'Basic Analytics', starter: true, pro: true, enterprise: true },
        { name: 'Advanced Reporting', starter: false, pro: true, enterprise: true },
        { name: 'Market Insights', starter: false, pro: true, enterprise: true },
        { name: 'Custom Dashboards', starter: false, pro: false, enterprise: true },
        { name: 'API Access', starter: false, pro: false, enterprise: true },
      ]
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
          color: 'white',
          py: 12,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem' },
                mb: 3,
              }}
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
              }}
            >
              Choose the perfect plan for your career goals. All plans include our core AI features.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#fbbf24',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#fbbf24',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Annual Billing</Typography>
                  <Chip
                    label="Save 17%"
                    size="small"
                    sx={{
                      backgroundColor: '#fbbf24',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              }
              sx={{ color: 'white' }}
            />
          </Box>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={4} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                className={plan.popular ? 'professional-hover' : 'hover-lift'}
                sx={{
                  height: '100%',
                  position: 'relative',
                  borderRadius: 4,
                  border: plan.popular ? '3px solid #8B6F47' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                {plan.popular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: plan.gradient,
                      color: 'white',
                      py: 1,
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    MOST POPULAR
                  </Box>
                )}
                <CardContent sx={{ p: 4, pt: plan.popular ? 6 : 4 }}>
                  <Stack spacing={3}>
                    <Box textAlign="center">
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          background: plan.gradient,
                          color: 'white',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        {plan.icon}
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {plan.description}
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h2"
                          sx={{
                            fontWeight: 800,
                            background: plan.gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          ${isAnnual ? plan.price.annual : plan.price.monthly}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.price.monthly === 0 ? 'Forever free' : isAnnual ? 'per year' : 'per month'}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      size="large"
                      fullWidth
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/register')}
                      sx={{
                        py: 2,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        ...(plan.popular && {
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          border: '2px solid #FBBF24',
                          boxShadow: '0 6px 24px rgba(245, 158, 11, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            transform: 'translateY(-3px) scale(1.02)',
                            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.6)',
                          },
                        }),
                        ...(!plan.popular && {
                          borderWidth: 2,
                          color: '#8B6F47',
                          borderColor: '#8B6F47',
                          '&:hover': {
                            borderWidth: 2,
                            backgroundColor: alpha('#8B6F47', 0.1),
                            transform: 'translateY(-2px)',
                          },
                        }),
                      }}
                    >
                      {plan.price.monthly === 0 ? 'Get Started Free' : 'Start Free Trial'}
                    </Button>

                    <Divider />

                    <List sx={{ p: 0 }}>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: 500,
                            }}
                          />
                        </ListItem>
                      ))}
                      {plan.limitations.map((limitation, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Close sx={{ color: '#ef4444', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={limitation}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              color: 'text.secondary',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Feature Comparison */}
      <Box sx={{ backgroundColor: '#f8fafc', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
              Feature Comparison
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Compare features across all plans
            </Typography>
          </Box>

          {features.map((category, index) => (
            <Card key={index} sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {category.category}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {category.items.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                        <Typography sx={{ flex: 1, fontWeight: 500 }}>
                          {item.name}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Starter
                        </Typography>
                        {category.items.map((item, idx) => (
                          <Box key={idx} sx={{ py: 1 }}>
                            {item.starter ? (
                              <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                            ) : (
                              <Close sx={{ color: '#ef4444', fontSize: 20 }} />
                            )}
                          </Box>
                        ))}
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Professional
                        </Typography>
                        {category.items.map((item, idx) => (
                          <Box key={idx} sx={{ py: 1 }}>
                            {item.pro ? (
                              <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                            ) : (
                              <Close sx={{ color: '#ef4444', fontSize: 20 }} />
                            )}
                          </Box>
                        ))}
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Enterprise
                        </Typography>
                        {category.items.map((item, idx) => (
                          <Box key={idx} sx={{ py: 1 }}>
                            {item.enterprise ? (
                              <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                            ) : (
                              <Close sx={{ color: '#ef4444', fontSize: 20 }} />
                            )}
                          </Box>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 800 }}>
            Frequently Asked Questions
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {faqs.map((faq, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card className="hover-lift" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  {faq.question}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </Card>
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
              Ready to Transform Your Career?
            </Typography>
            <Typography variant="h6" paragraph sx={{ opacity: 0.9, mb: 4 }}>
              Start your 14-day free trial today. No credit card required.
            </Typography>
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
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PricingPage;