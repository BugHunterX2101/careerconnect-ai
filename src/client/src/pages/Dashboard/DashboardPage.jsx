import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  useTheme,
} from '@mui/material'
import {
  Description,
  Work,
  TrendingUp,
  Assessment,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DashboardPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()

  const dashboardItems = [
    {
      title: 'Upload Resume',
      description: 'Upload and analyze your resume with AI',
      icon: <Description sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      action: () => navigate('/resume/upload'),
      color: theme.palette.primary.main,
    },
    {
      title: 'Job Recommendations',
      description: 'Get personalized job recommendations',
      icon: <Work sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      action: () => navigate('/jobs/recommendations'),
      color: theme.palette.secondary.main,
    },
    {
      title: 'Career Insights',
      description: 'AI-powered career insights and analytics',
      icon: <TrendingUp sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      action: () => navigate('/dashboard/insights'),
      color: theme.palette.success.main,
    },
    {
      title: 'Applications',
      description: 'Track your job applications',
      icon: <Assessment sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      action: () => navigate('/jobs/applied'),
      color: theme.palette.info.main,
    },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.firstName || user?.email}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Here's what you can do with CareerConnect
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {dashboardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{item.icon}</Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  onClick={item.action}
                  sx={{ color: item.color }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Resumes Uploaded
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Jobs Applied
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Saved Jobs
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Profile Completion
                </Typography>
                <Typography variant="h4">0%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default DashboardPage
