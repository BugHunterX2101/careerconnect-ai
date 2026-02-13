import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  People,
  Work,
  Schedule,
  Visibility,
  ThumbUp
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalJobs: 15,
      activeJobs: 8,
      totalApplicants: 342,
      interviewsScheduled: 28,
      hiredCandidates: 12,
      avgTimeToHire: 18
    },
    applicationTrends: [],
    jobPerformance: [],
    sourceAnalytics: [],
    topPerformingJobs: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Mock data - replace with actual API call
    const mockData = {
      overview: {
        totalJobs: 15,
        activeJobs: 8,
        totalApplicants: 342,
        interviewsScheduled: 28,
        hiredCandidates: 12,
        avgTimeToHire: 18
      },
      applicationTrends: [
        { month: 'Jan', applications: 45, interviews: 12, hires: 3 },
        { month: 'Feb', applications: 52, interviews: 15, hires: 4 },
        { month: 'Mar', applications: 38, interviews: 10, hires: 2 },
        { month: 'Apr', applications: 61, interviews: 18, hires: 5 },
        { month: 'May', applications: 55, interviews: 16, hires: 4 },
        { month: 'Jun', applications: 48, interviews: 14, hires: 3 }
      ],
      jobPerformance: [
        { job: 'Frontend Dev', applications: 85, views: 320, conversion: 26.6 },
        { job: 'Backend Dev', applications: 72, views: 280, conversion: 25.7 },
        { job: 'Product Manager', applications: 45, views: 180, conversion: 25.0 },
        { job: 'UX Designer', applications: 38, views: 160, conversion: 23.8 },
        { job: 'Data Scientist', applications: 29, views: 140, conversion: 20.7 }
      ],
      sourceAnalytics: [
        { name: 'Direct Apply', value: 35, color: '#8884d8' },
        { name: 'LinkedIn', value: 28, color: '#82ca9d' },
        { name: 'Job Boards', value: 20, color: '#ffc658' },
        { name: 'Referrals', value: 12, color: '#ff7300' },
        { name: 'Other', value: 5, color: '#00ff00' }
      ],
      topPerformingJobs: [
        {
          id: 1,
          title: 'Senior Frontend Developer',
          applications: 85,
          views: 320,
          conversionRate: 26.6,
          status: 'active'
        },
        {
          id: 2,
          title: 'Backend Engineer',
          applications: 72,
          views: 280,
          conversionRate: 25.7,
          status: 'active'
        },
        {
          id: 3,
          title: 'Product Manager',
          applications: 45,
          views: 180,
          conversionRate: 25.0,
          status: 'paused'
        }
      ]
    };
    setAnalytics(mockData);
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recruitment Analytics
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Jobs"
            value={analytics.overview.totalJobs}
            icon={<Work />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active Jobs"
            value={analytics.overview.activeJobs}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Applicants"
            value={analytics.overview.totalApplicants}
            icon={<People />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Interviews"
            value={analytics.overview.interviewsScheduled}
            icon={<Schedule />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Hired"
            value={analytics.overview.hiredCandidates}
            icon={<ThumbUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Avg. Time to Hire"
            value={`${analytics.overview.avgTimeToHire} days`}
            icon={<Schedule />}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Application Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#8884d8" name="Applications" />
                  <Line type="monotone" dataKey="interviews" stroke="#82ca9d" name="Interviews" />
                  <Line type="monotone" dataKey="hires" stroke="#ffc658" name="Hires" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Sources */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Sources
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.sourceAnalytics}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.sourceAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Performance */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FormattedMessage id="analytics.jobPerformance" defaultMessage="Job Performance" />
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.jobPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="job" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                  <Bar dataKey="views" fill="#82ca9d" name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performing Jobs */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FormattedMessage id="analytics.topPerformingJobs" defaultMessage="Top Performing Jobs" />
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Title</TableCell>
                      <TableCell align="right">Applications</TableCell>
                      <TableCell align="right">Conv. Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topPerformingJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" noWrap>
                              {job.title}
                            </Typography>
                            <Chip
                              label={job.status}
                              size="small"
                              color={job.status === 'active' ? 'success' : 'warning'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{job.applications}</TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2">
                              {job.conversionRate}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={job.conversionRate}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Conversion Funnel */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recruitment Funnel
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {analytics.overview.totalApplicants}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Applications
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {Math.round(analytics.overview.totalApplicants * 0.3)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Screened
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {analytics.overview.interviewsScheduled}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Interviews
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {analytics.overview.hiredCandidates}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hired
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Overall Conversion Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(analytics.overview.hiredCandidates / analytics.overview.totalApplicants) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {((analytics.overview.hiredCandidates / analytics.overview.totalApplicants) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;