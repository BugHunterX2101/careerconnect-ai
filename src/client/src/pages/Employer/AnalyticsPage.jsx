import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  People,
  Work,
  Schedule,
  ThumbUp
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FixedSizeList } from 'react-window';
import { ExecutiveTable, MetricChip, SignatureCard, TrendBadge } from '../../components/common';

const CHART_COLORS = {
  accent: '#0F5FCC',
  support: '#1F73F2',
  warm: '#F57A2E',
  success: '#10B981',
  muted: '#8DA0B6',
  axis: '#40566E',
  grid: '#D2DBE5',
};

const StatCard = React.memo(function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <SignatureCard>
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
            <Box sx={{ mt: 1 }}>
              <TrendBadge direction="up" label="Healthy trend" />
            </Box>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </SignatureCard>
  );
});

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

  const isLowEndDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const lowCpu = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    return Boolean(prefersReducedMotion || lowCpu);
  }, []);

  const chartAnimation = useMemo(() => ({
    isAnimationActive: !isLowEndDevice,
    animationDuration: isLowEndDevice ? 0 : 320,
  }), [isLowEndDevice]);

  const applicationTrendData = useMemo(() => analytics.applicationTrends.slice(-12), [analytics.applicationTrends]);
  const jobPerformanceData = useMemo(() => analytics.jobPerformance.slice(0, 8), [analytics.jobPerformance]);
  const sourceAnalyticsData = useMemo(() => analytics.sourceAnalytics.slice(0, 6), [analytics.sourceAnalytics]);
  const topJobsData = useMemo(() => analytics.topPerformingJobs.slice(0, 6), [analytics.topPerformingJobs]);

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
        { name: 'Direct Apply', value: 35, color: '#0F5FCC' },
        { name: 'LinkedIn', value: 28, color: '#1F73F2' },
        { name: 'Job Boards', value: 20, color: '#10B981' },
        { name: 'Referrals', value: 12, color: '#F57A2E' },
        { name: 'Other', value: 5, color: '#8DA0B6' }
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

  const topJobsListHeight = useMemo(() => {
    if (topJobsData.length === 0) return 0;
    return Math.min(320, topJobsData.length * 68);
  }, [topJobsData.length]);

  const TopJobRow = ({ index, style }) => {
    const job = topJobsData[index];
    if (!job) return null;
    return (
      <Box
        style={style}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 0.8fr 1.1fr',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 1,
          gap: 1,
        }}
      >
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
        <Typography align="right" variant="body2">{job.applications}</Typography>
        <Box>
          <Typography align="right" variant="body2">{job.conversionRate}%</Typography>
          <LinearProgress variant="determinate" value={job.conversionRate} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }} className="motion-page-enter">
      <Box className="dashboard-highlight-panel" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Recruitment Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, maxWidth: 850 }}>
          Executive overview of pipeline velocity, source quality, and conversion efficiency across active hiring campaigns.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <MetricChip label="Data refreshed" color="success" />
          <MetricChip label="Forecast enabled" />
          <MetricChip label="Stakeholder-ready" color="warning" />
        </Box>
      </Box>

      <Typography variant="h4" gutterBottom sx={{ display: 'none' }}>
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
          <SignatureCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.axis} />
                  <YAxis stroke={CHART_COLORS.axis} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="applications" stroke={CHART_COLORS.accent} strokeWidth={2} name="Applications" {...chartAnimation} dot={false} />
                  <Line type="monotone" dataKey="interviews" stroke={CHART_COLORS.success} strokeWidth={2} name="Interviews" {...chartAnimation} dot={false} />
                  <Line type="monotone" dataKey="hires" stroke={CHART_COLORS.warm} strokeWidth={2} name="Hires" {...chartAnimation} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </SignatureCard>
        </Grid>

        {/* Application Sources */}
        <Grid item xs={12} lg={4}>
          <SignatureCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Sources
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceAnalyticsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    {...chartAnimation}
                  >
                    {sourceAnalyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </SignatureCard>
        </Grid>

        {/* Job Performance */}
        <Grid item xs={12} lg={8}>
          <SignatureCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Funnel Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="job" stroke={CHART_COLORS.axis} />
                  <YAxis stroke={CHART_COLORS.axis} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="applications" fill={CHART_COLORS.accent} name="Applications" radius={[6, 6, 0, 0]} {...chartAnimation} />
                  <Bar dataKey="views" fill={CHART_COLORS.support} name="Views" radius={[6, 6, 0, 0]} {...chartAnimation} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </SignatureCard>
        </Grid>

        {/* Top Performing Jobs */}
        <Grid item xs={12} lg={4}>
          <SignatureCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Jobs
              </Typography>
              <ExecutiveTable compact>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.9fr 0.8fr 1.1fr', px: 1, py: 0.75, gap: 1 }}>
                  <Typography variant="caption" fontWeight={700}>Job Title</Typography>
                  <Typography variant="caption" fontWeight={700} align="right">Applications</Typography>
                  <Typography variant="caption" fontWeight={700} align="right">Conv. Rate</Typography>
                </Box>
                <FixedSizeList
                  height={topJobsListHeight}
                  width="100%"
                  itemCount={topJobsData.length}
                  itemSize={68}
                >
                  {TopJobRow}
                </FixedSizeList>
              </ExecutiveTable>
            </CardContent>
          </SignatureCard>
        </Grid>

        {/* Conversion Funnel */}
        <Grid item xs={12}>
          <SignatureCard>
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
          </SignatureCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;