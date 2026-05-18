const http = require('http');

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
let employerToken = '';
let employeeToken = '';
let jobId = '';
let conversationId = '';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, body: json, raw });
      });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function test(label, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`  PASS  ${label}`);
      passed++;
    } else {
      console.log(`  FAIL  ${label}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ERR   ${label}: ${e.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n=== CareerConnect AI - End-to-End Tests ===\n');

  // --- HEALTH ---
  console.log('[ Health ]');
  await test('GET /health → 200 ok', async () => {
    const r = await req('GET', '/health');
    return r.status === 200 && r.body && r.body.status === 'ok';
  });
  await test('GET /api/status → 401 (auth required)', async () => {
    const r = await req('GET', '/api/status');
    return r.status === 401 || r.status === 403;
  });

  // --- AUTH ---
  console.log('\n[ Auth ]');
  const ts = Date.now();
  const empEmail = `employer_${ts}@test.com`;
  const empEmail2 = `employee_${ts}@test.com`;

  await test('POST /api/auth/register employer → 200/201', async () => {
    const r = await req('POST', '/api/auth/register', {
      firstName: 'Test', lastName: 'Employer', email: empEmail,
      password: 'Test123!', role: 'employer', company: 'TestCo',
    });
    if (r.body && r.body.token) employerToken = r.body.token;
    return r.status === 200 || r.status === 201;
  });
  await test('POST /api/auth/register employee → 200/201', async () => {
    const r = await req('POST', '/api/auth/register', {
      firstName: 'Test', lastName: 'Employee', email: empEmail2,
      password: 'Test123!', role: 'jobseeker',
    });
    if (r.body && r.body.token) employeeToken = r.body.token;
    return r.status === 200 || r.status === 201;
  });
  await test('POST /api/auth/login employer → token', async () => {
    const r = await req('POST', '/api/auth/login', { email: empEmail, password: 'Test123!' });
    if (r.body && r.body.token) employerToken = r.body.token;
    return !!(r.body && r.body.token);
  });
  await test('POST /api/auth/login employee → token', async () => {
    const r = await req('POST', '/api/auth/login', { email: empEmail2, password: 'Test123!' });
    if (r.body && r.body.token) employeeToken = r.body.token;
    return !!(r.body && r.body.token);
  });
  await test('POST /api/auth/login wrong password → 400/401', async () => {
    const r = await req('POST', '/api/auth/login', { email: empEmail, password: 'wrongpass' });
    return r.status === 401 || r.status === 400;
  });

  // --- PROFILE ---
  console.log('\n[ Profile ]');
  await test('GET /api/profile → 200 with auth', async () => {
    const r = await req('GET', '/api/profile', null, employerToken);
    return r.status === 200;
  });
  await test('GET /api/profile → 401 without auth', async () => {
    const r = await req('GET', '/api/profile');
    return r.status === 401;
  });
  await test('PUT /api/profile → 200', async () => {
    const r = await req('PUT', '/api/profile', { bio: 'Test bio updated' }, employeeToken);
    return r.status === 200;
  });

  // --- JOBS ---
  console.log('\n[ Jobs ]');
  await test('GET /api/jobs → 200 (public listing)', async () => {
    const r = await req('GET', '/api/jobs');
    return r.status === 200 && r.body && Array.isArray(r.body.jobs);
  });
  await test('GET /api/jobs?search=Dev → search works', async () => {
    const r = await req('GET', '/api/jobs?search=Dev');
    return r.status === 200 && r.body && Array.isArray(r.body.jobs);
  });
  await test('POST /api/employer/jobs → create job', async () => {
    const r = await req('POST', '/api/employer/jobs', {
      title: 'Senior Dev', company: 'TestCo', location: 'Remote',
      description: 'Great job opportunity for skilled developers',
      requirements: ['React', 'Node.js'],
      salary: { min: 80000, max: 120000, currency: 'USD' },
      type: 'full-time', skills: ['React', 'Node.js'],
    }, employerToken);
    if ((r.status === 200 || r.status === 201) && r.body) {
      const j = r.body.job || r.body;
      jobId = j._id || j.id || '';
    }
    return r.status === 200 || r.status === 201;
  });
  await test('GET /api/employer/jobs → employer job list', async () => {
    const r = await req('GET', '/api/employer/jobs', null, employerToken);
    return r.status === 200;
  });
  if (jobId) {
    await test('GET /api/jobs/:id → job detail', async () => {
      const r = await req('GET', `/api/jobs/${jobId}`);
      return r.status === 200;
    });
    await test('PUT /api/employer/jobs/:id → update job', async () => {
      const r = await req('PUT', `/api/employer/jobs/${jobId}`, {
        title: 'Updated Senior Dev', company: 'TestCo', location: 'Remote',
        description: 'Great job opportunity for skilled developers',
        requirements: ['React', 'Node.js'],
        salary: { min: 80000, max: 120000, currency: 'USD' },
        type: 'full-time',
      }, employerToken);
      return r.status === 200;
    });
  }

  // --- APPLICATIONS ---
  console.log('\n[ Applications ]');
  if (jobId) {
    await test('POST /api/jobs/apply/:id → apply for job', async () => {
      const r = await req('POST', `/api/jobs/apply/${jobId}`, {
        coverLetter: 'I am very interested in this role.',
      }, employeeToken);
      return r.status === 200 || r.status === 201 || r.status === 409 || r.status === 400;
    });
  }
  await test('GET /api/employee/applications → employee applications', async () => {
    const r = await req('GET', '/api/employee/applications', null, employeeToken);
    return r.status === 200;
  });
  if (jobId) {
    await test('GET /api/employer/jobs/:id/applicants → employer view', async () => {
      const r = await req('GET', `/api/employer/jobs/${jobId}/applicants`, null, employerToken);
      return r.status === 200;
    });
  }

  // --- INTERVIEWS / VIDEO ---
  console.log('\n[ Interviews / Video ]');
  await test('GET /api/video/interviews → 200 (no crash)', async () => {
    const r = await req('GET', '/api/video/interviews', null, employeeToken);
    return r.status === 200;
  });
  await test('GET /api/video/upcoming → 200 (no crash)', async () => {
    const r = await req('GET', '/api/video/upcoming', null, employeeToken);
    return r.status === 200;
  });
  if (jobId) {
    await test('POST /api/employer/interviews → schedule interview', async () => {
      const r = await req('POST', '/api/employer/interviews', {
        jobId,
        candidateId: 2,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 60,
        type: 'video',
        notes: 'Technical interview',
      }, employerToken);
      return r.status === 200 || r.status === 201;
    });
  }
  await test('GET /api/employer/interviews → employer list', async () => {
    const r = await req('GET', '/api/employer/interviews', null, employerToken);
    return r.status === 200;
  });
  await test('GET /api/employee/interviews → employee list', async () => {
    const r = await req('GET', '/api/employee/interviews', null, employeeToken);
    return r.status === 200;
  });

  // --- CHAT ---
  console.log('\n[ Chat ]');
  await test('GET /api/chat/conversations → 200', async () => {
    const r = await req('GET', '/api/chat/conversations', null, employeeToken);
    return r.status === 200;
  });
  await test('POST /api/chat/conversations → create conversation', async () => {
    const r = await req('POST', '/api/chat/conversations', {
      participantIds: [1],
      type: 'direct',
    }, employeeToken);
    if ((r.status === 200 || r.status === 201) && r.body) {
      const conv = r.body.conversation || r.body;
      conversationId = conv._id || conv.id || '';
    }
    return r.status === 200 || r.status === 201;
  });
  if (conversationId) {
    await test('GET /api/chat/conversations/:id/messages → 200', async () => {
      const r = await req('GET', `/api/chat/conversations/${conversationId}/messages`, null, employeeToken);
      return r.status === 200;
    });
    await test('POST /api/chat/conversations/:id/messages → send message', async () => {
      const r = await req('POST', `/api/chat/conversations/${conversationId}/messages`, {
        content: 'Hello, I am interested in the position!',
      }, employeeToken);
      return r.status === 200 || r.status === 201;
    });
  }

  // --- ML ENDPOINTS ---
  console.log('\n[ ML / AI ]');
  await test('GET /api/ml/market-insights → 200', async () => {
    const r = await req('GET', '/api/ml/market-insights', null, employeeToken);
    return r.status === 200;
  });
  await test('POST /api/ml/job-recommendations → 200', async () => {
    const r = await req('POST', '/api/ml/job-recommendations', {
      skills: ['React', 'Node.js'], experience: 2, location: 'Remote',
    }, employeeToken);
    return r.status === 200;
  });
  await test('POST /api/ml/skill-gap-analysis → 200', async () => {
    const r = await req('POST', '/api/ml/skill-gap-analysis', {
      currentSkills: ['React', 'JavaScript'], targetRole: 'Senior Software Engineer',
    }, employeeToken);
    return r.status === 200;
  });
  await test('GET /api/ml/career-insights → 200', async () => {
    const r = await req('GET', '/api/ml/career-insights', null, employeeToken);
    return r.status === 200;
  });
  if (jobId) {
    await test('GET /api/employer/jobs/:jobId/matching-candidates → 200', async () => {
      const r = await req('GET', `/api/employer/jobs/${jobId}/matching-candidates`, null, employerToken);
      return r.status === 200;
    });
  }

  // --- BERT / RESUME ---
  console.log('\n[ BERT / Resume ]');
  await test('GET /api/bert/health → 200', async () => {
    const r = await req('GET', '/api/bert/health');
    return r.status === 200 || r.status === 503;
  });
  await test('POST /api/bert/parse → 200 or 503', async () => {
    const r = await req('POST', '/api/bert/parse', {
      resumeText: 'Experienced software engineer with 5 years in React and Node.js.',
    }, employeeToken);
    return r.status === 200 || r.status === 503 || r.status === 400;
  });
  await test('POST /api/bert/compare-job → 200 or 503', async () => {
    const r = await req('POST', '/api/bert/compare-job', {
      resumeText: 'React developer with 3 years experience',
      jobDescription: 'Looking for React developer with Node.js skills',
    }, employeeToken);
    return r.status === 200 || r.status === 503 || r.status === 400;
  });
  await test('GET /api/bert/high-paying-skills → 200/400/503', async () => {
    const r = await req('GET', '/api/bert/high-paying-skills', null, employeeToken);
    return r.status === 200 || r.status === 400 || r.status === 503;
  });

  // --- EMPLOYER ANALYTICS ---
  console.log('\n[ Employer Analytics ]');
  await test('GET /api/employer/analytics → 200', async () => {
    const r = await req('GET', '/api/employer/analytics', null, employerToken);
    return r.status === 200;
  });
  await test('GET /api/employer/dashboard/stats → 200', async () => {
    const r = await req('GET', '/api/employer/dashboard/stats', null, employerToken);
    return r.status === 200;
  });
  await test('GET /api/employee/dashboard/stats → 200', async () => {
    const r = await req('GET', '/api/employee/dashboard/stats', null, employeeToken);
    return r.status === 200;
  });

  // --- SEARCH ---
  console.log('\n[ Search (authenticated) ]');
  await test('GET /api/jobs/search → 200 with auth', async () => {
    const r = await req('GET', '/api/jobs/search?q=developer', null, employeeToken);
    return r.status === 200;
  });
  await test('GET /api/employer/candidates/search → 200', async () => {
    const r = await req('GET', '/api/employer/candidates/search?q=React', null, employerToken);
    return r.status === 200;
  });

  // --- FRONTEND SPA ---
  console.log('\n[ Frontend SPA ]');
  await test('GET / → 200 (SPA served)', async () => {
    const r = await req('GET', '/');
    return r.status === 200;
  });
  await test('GET /login → 200 (SPA route)', async () => {
    const r = await req('GET', '/login');
    return r.status === 200;
  });
  await test('GET /register → 200 (SPA route)', async () => {
    const r = await req('GET', '/register');
    return r.status === 200;
  });
  await test('GET /employer/dashboard → 200 (SPA route)', async () => {
    const r = await req('GET', '/employer/dashboard');
    return r.status === 200;
  });

  // --- SUMMARY ---
  const total = passed + failed;
  console.log(`\n${'='.repeat(44)}`);
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log('='.repeat(44));
  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
