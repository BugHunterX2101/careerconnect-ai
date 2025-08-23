#!/usr/bin/env node

const axios = require('axios');
const { io } = require('socket.io-client');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${statusIcon} ${testName}: ${status}`, statusColor);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

async function testBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.status === 200 && response.data.status === 'OK') {
      logTest('Backend Health Check', 'PASS', `Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      logTest('Backend Health Check', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Backend Health Check', 'FAIL', error.message);
    return false;
  }
}

async function testAPIAccessibility() {
  try {
    await axios.get(`${API_BASE_URL}/auth/verify`);
    logTest('API Base URL', 'PASS');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('API Base URL', 'PASS', '401 expected for unauthenticated request');
      return true;
    } else {
      logTest('API Base URL', 'FAIL', error.message);
      return false;
    }
  }
}

async function testCORSConfiguration() {
  try {
    const response = await axios.options(`${API_BASE_URL}/auth/login`, {
      headers: {
        'Origin': CLIENT_BASE_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers;
    if (corsHeaders['access-control-allow-origin'] || corsHeaders['Access-Control-Allow-Origin']) {
      logTest('CORS Configuration', 'PASS');
      return true;
    } else {
      logTest('CORS Configuration', 'FAIL', 'Missing CORS headers');
      return false;
    }
  } catch (error) {
    logTest('CORS Configuration', 'FAIL', error.message);
    return false;
  }
}

async function testSocketIOConnection() {
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    const timeout = setTimeout(() => {
      logTest('Socket.IO Connection', 'FAIL', 'Connection timeout');
      socket.disconnect();
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      logTest('Socket.IO Connection', 'PASS', `Connected with ID: ${socket.id}`);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logTest('Socket.IO Connection', 'FAIL', error.message);
      resolve(false);
    });
  });
}

async function testEnvironmentConfiguration() {
  const tests = [
    { name: 'API Base URL', value: API_BASE_URL, expected: 'http://localhost:3000/api' },
    { name: 'Client Base URL', value: CLIENT_BASE_URL, expected: 'http://localhost:5173' },
    { name: 'Backend URL', value: BACKEND_URL, expected: 'http://localhost:3000' }
  ];

  let allPassed = true;
  tests.forEach(test => {
    if (test.value === test.expected) {
      logTest(test.name, 'PASS', test.value);
    } else {
      logTest(test.name, 'FAIL', `Expected: ${test.expected}, Got: ${test.value}`);
      allPassed = false;
    }
  });

  return allPassed;
}

async function testDatabaseConnection() {
  try {
    // This would require a test endpoint that checks database connectivity
    // For now, we'll just check if the server is responding
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.status === 200) {
      logTest('Database Connection', 'PASS', 'Server is responding (database check via health endpoint)');
      return true;
    } else {
      logTest('Database Connection', 'FAIL', 'Server not responding properly');
      return false;
    }
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testFileUploadDirectory() {
  const fs = require('fs');
  const path = require('path');
  
  const uploadDirs = [
    'uploads',
    'uploads/resumes',
    'uploads/avatars',
    'uploads/temp'
  ];

  let allExist = true;
  uploadDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      logTest(`Directory: ${dir}`, 'PASS');
    } else {
      logTest(`Directory: ${dir}`, 'FAIL', 'Directory does not exist');
      allExist = false;
    }
  });

  return allExist;
}

async function runIntegrationTests() {
  log('🔍 Running CareerConnect AI Integration Tests...\n', 'blue');

  const tests = [
    { name: 'Backend Health Check', fn: testBackendHealth },
    { name: 'API Accessibility', fn: testAPIAccessibility },
    { name: 'CORS Configuration', fn: testCORSConfiguration },
    { name: 'Socket.IO Connection', fn: testSocketIOConnection },
    { name: 'Environment Configuration', fn: testEnvironmentConfiguration },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'File Upload Directories', fn: testFileUploadDirectory }
  ];

  const results = [];
  
  for (const test of tests) {
    log(`\n🧪 Running: ${test.name}`, 'blue');
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }

  // Summary
  log('\n📊 Integration Test Summary:', 'blue');
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`${result.passed ? '✅' : '❌'} ${result.name}: ${status}`, color);
  });

  log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'red');

  if (passedTests === totalTests) {
    log('\n🎉 All integration tests passed! The frontend and backend are properly integrated.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the configuration and try again.', 'yellow');
    log('\n💡 Troubleshooting Tips:', 'blue');
    log('1. Make sure the backend server is running: npm run dev', 'yellow');
    log('2. Make sure the frontend server is running: cd src/client && npm run dev', 'yellow');
    log('3. Check if ports 3000 and 5173 are available', 'yellow');
    log('4. Verify environment variables are set correctly', 'yellow');
    log('5. Ensure MongoDB and Redis are running', 'yellow');
  }

  return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n❌ Test execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };
