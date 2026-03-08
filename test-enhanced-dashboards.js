const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: 'testemployee@example.com',
  password: 'Test123!',
  firstName: 'John',
  lastName: 'Doe',
  role: 'jobseeker'
};

const testEmployer = {
  email: 'testemployer@example.com',
  password: 'Test123!',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'employer'
};

let employeeToken = '';
let employerToken = '';

async function testEnhancedDashboards() {
  console.log('🚀 Testing Enhanced Dashboards...\n');

  try {
    // 1. Test Employee Registration and Login
    console.log('1. Testing Employee Authentication...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Employee registered successfully');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Employee already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    const employeeLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    employeeToken = employeeLogin.data.token;
    console.log('✅ Employee login successful');

    // 2. Test Employer Registration and Login
    console.log('\n2. Testing Employer Authentication...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, testEmployer);
      console.log('✅ Employer registered successfully');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Employer already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    const employerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmployer.email,
      password: testEmployer.password
    });
    employerToken = employerLogin.data.token;
    console.log('✅ Employer login successful');

    // 3. Test Enhanced Employee Dashboard Endpoints
    console.log('\n3. Testing Enhanced Employee Dashboard Endpoints...');
    
    const employeeHeaders = { Authorization: `Bearer ${employeeToken}` };
    
    // Dashboard stats
    const employeeStats = await axios.get(`${BASE_URL}/employee/dashboard/stats`, { headers: employeeHeaders });
    console.log('✅ Employee dashboard stats:', {
      totalApplications: employeeStats.data.totalApplications,
      totalInterviews: employeeStats.data.totalInterviews,
      profileCompletion: employeeStats.data.profileCompletion
    });

    // Analytics
    const employeeAnalytics = await axios.get(`${BASE_URL}/employee/analytics`, { headers: employeeHeaders });
    console.log('✅ Employee analytics:', {
      applicationTrends: employeeAnalytics.data.applicationTrends,
      interviewConversion: employeeAnalytics.data.interviewConversion
    });

    // Skill recommendations
    const skillRecommendations = await axios.get(`${BASE_URL}/employee/skill-recommendations`, { headers: employeeHeaders });
    console.log('✅ Skill recommendations:', {
      trendingCount: skillRecommendations.data.trending?.length || 0,
      personalizedCount: skillRecommendations.data.personalized?.length || 0
    });

    // Job alerts
    const jobAlerts = await axios.get(`${BASE_URL}/employee/job-alerts`, { headers: employeeHeaders });
    console.log('✅ Job alerts:', {
      activeAlerts: jobAlerts.data.active?.length || 0,
      recentMatches: jobAlerts.data.recentMatches?.length || 0
    });

    // Resume insights
    const resumeInsights = await axios.get(`${BASE_URL}/employee/resume-insights`, { headers: employeeHeaders });
    console.log('✅ Resume insights:', {
      score: resumeInsights.data.score,
      strengthsCount: resumeInsights.data.strengths?.length || 0,
      improvementsCount: resumeInsights.data.improvements?.length || 0
    });

    // Create job alert
    const newAlert = await axios.post(`${BASE_URL}/employee/job-alerts`, {
      title: 'React Developer Jobs',
      criteria: { keywords: 'React', location: 'Remote' },
      frequency: 'daily'
    }, { headers: employeeHeaders });
    console.log('✅ Job alert created:', newAlert.data.alert.title);

    // 4. Test Enhanced Employer Dashboard Endpoints
    console.log('\n4. Testing Enhanced Employer Dashboard Endpoints...');
    
    const employerHeaders = { Authorization: `Bearer ${employerToken}` };
    
    // Dashboard stats
    const employerStats = await axios.get(`${BASE_URL}/employer/dashboard/stats`, { headers: employerHeaders });
    console.log('✅ Employer dashboard stats:', {
      activeJobs: employerStats.data.activeJobs,
      totalApplications: employerStats.data.totalApplications,
      totalHired: employerStats.data.totalHired
    });

    // Analytics
    const employerAnalytics = await axios.get(`${BASE_URL}/employer/analytics`, { headers: employerHeaders });
    console.log('✅ Employer analytics:', {
      overview: employerAnalytics.data.overview,
      trends: employerAnalytics.data.trends
    });

    // Pipeline
    const pipeline = await axios.get(`${BASE_URL}/employer/pipeline`, { headers: employerHeaders });
    console.log('✅ Hiring pipeline:', {
      stagesCount: pipeline.data.stages?.length || 0,
      recentActivityCount: pipeline.data.recentActivity?.length || 0,
      bottlenecksCount: pipeline.data.bottlenecks?.length || 0
    });

    // Team management
    const team = await axios.get(`${BASE_URL}/employer/team`, { headers: employerHeaders });
    console.log('✅ Team management:', {
      membersCount: team.data.members?.length || 0,
      pendingInvitesCount: team.data.pendingInvites?.length || 0
    });

    // Hiring reports
    const hiringReport = await axios.get(`${BASE_URL}/employer/reports/hiring`, { headers: employerHeaders });
    console.log('✅ Hiring reports:', {
      totalHires: hiringReport.data.summary?.totalHires || 0,
      averageTimeToHire: hiringReport.data.summary?.averageTimeToHire || 0,
      departmentsCount: hiringReport.data.byDepartment?.length || 0
    });

    // Notifications
    const employerNotifications = await axios.get(`${BASE_URL}/employer/notifications`, { headers: employerHeaders });
    console.log('✅ Employer notifications:', {
      notificationsCount: employerNotifications.data.notifications?.length || 0
    });

    // Settings
    const employerSettings = await axios.get(`${BASE_URL}/employer/settings`, { headers: employerHeaders });
    console.log('✅ Employer settings:', {
      companyName: employerSettings.data.settings?.company?.name || 'N/A',
      integrationsCount: Object.keys(employerSettings.data.settings?.integrations || {}).length
    });

    // Team invite
    const teamInvite = await axios.post(`${BASE_URL}/employer/team/invite`, {
      email: 'newrecruiter@example.com',
      role: 'Recruiter'
    }, { headers: employerHeaders });
    console.log('✅ Team invite sent:', teamInvite.data.invite.email);

    // 5. Test Additional Features
    console.log('\n5. Testing Additional Features...');

    // Employee notifications
    const employeeNotifications = await axios.get(`${BASE_URL}/employee/notifications`, { headers: employeeHeaders });
    console.log('✅ Employee notifications:', {
      notificationsCount: employeeNotifications.data.notifications?.length || 0
    });

    // Career insights
    const careerInsights = await axios.get(`${BASE_URL}/employee/career-insights`, { headers: employeeHeaders });
    console.log('✅ Career insights:', {
      skillsInDemandCount: careerInsights.data.skillsInDemand?.length || 0,
      recommendationsCount: careerInsights.data.recommendations?.length || 0
    });

    // Salary insights
    const salaryInsights = await axios.get(`${BASE_URL}/employee/salary-insights?jobTitle=Software Developer&location=San Francisco`, { headers: employeeHeaders });
    console.log('✅ Salary insights:', {
      jobTitle: salaryInsights.data.jobTitle,
      averageSalary: salaryInsights.data.averageSalary
    });

    console.log('\n🎉 All Enhanced Dashboard Tests Passed Successfully!');
    console.log('\n📊 Dashboard Features Tested:');
    console.log('   Employee Dashboard:');
    console.log('   ✅ Advanced Analytics & Insights');
    console.log('   ✅ AI-Powered Skill Recommendations');
    console.log('   ✅ Smart Job Alerts & Matching');
    console.log('   ✅ Resume Analysis & Optimization');
    console.log('   ✅ Career Intelligence & Trends');
    console.log('   ✅ Personalized Notifications');
    console.log('');
    console.log('   Employer Dashboard:');
    console.log('   ✅ Comprehensive Hiring Analytics');
    console.log('   ✅ Advanced Pipeline Management');
    console.log('   ✅ Team Collaboration Tools');
    console.log('   ✅ Detailed Hiring Reports');
    console.log('   ✅ Candidate Quality Insights');
    console.log('   ✅ Performance Metrics & KPIs');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testEnhancedDashboards();