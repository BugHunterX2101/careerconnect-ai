const http = require('http');
const { connectDB } = require('./src/database/connection');
const { getRedisClient } = require('./src/database/redis');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

async function checkDatabase() {
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

async function checkRedis() {
  try {
    const redisClient = getRedisClient();
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error.message);
    return false;
  }
}

async function checkHttpEndpoint() {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        console.error(`HTTP health check failed with status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.error('HTTP health check failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('HTTP health check timeout');
      req.destroy();
      resolve(false);
    });

    req.setTimeout(5000);
    req.end();
  });
}

async function performHealthCheck() {
  console.log('Performing health check...');
  
  const checks = [
    { name: 'Database', check: checkDatabase },
    { name: 'Redis', check: checkRedis },
    { name: 'HTTP Endpoint', check: checkHttpEndpoint }
  ];

  const results = await Promise.all(
    checks.map(async (check) => {
      const isHealthy = await check.check();
      return { name: check.name, healthy: isHealthy };
    })
  );

  const allHealthy = results.every(result => result.healthy);
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  });

  if (allHealthy) {
    console.log('All health checks passed');
    process.exit(0);
  } else {
    console.log('Some health checks failed');
    process.exit(1);
  }
}

// Run health check
performHealthCheck().catch((error) => {
  console.error('Health check error:', error);
  process.exit(1);
});
