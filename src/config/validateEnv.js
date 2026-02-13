const requiredEnvVars = {
  NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'], default: 'development' },
  PORT: { type: 'number', default: 3000 },
  JWT_SECRET: { type: 'string', required: true, minLength: 32 },
  MONGODB_URI: { type: 'string', required: false },
  REDIS_URL: { type: 'string', required: false }
};

const validateEnvVar = (key, config, value) => {
  if (config.required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (!value && config.default !== undefined) {
    process.env[key] = String(config.default);
    return;
  }

  if (!value) return;

  switch (config.type) {
    case 'number':
      if (isNaN(Number(value))) throw new Error(`${key} must be a number`);
      break;
    case 'url':
      try { new URL(value); } catch { throw new Error(`${key} must be a valid URL`); }
      break;
  }

  if (config.enum && !config.enum.includes(value)) {
    throw new Error(`${key} must be one of: ${config.enum.join(', ')}`);
  }

  if (config.minLength && value.length < config.minLength) {
    throw new Error(`${key} must be at least ${config.minLength} characters`);
  }
};

const validateEnvironment = () => {
  console.log('Validating environment variables...');
  const errors = [];

  for (const [key, config] of Object.entries(requiredEnvVars)) {
    try {
      validateEnvVar(key, config, process.env[key]);
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✓ Environment validation passed');
};

module.exports = { validateEnvironment };
