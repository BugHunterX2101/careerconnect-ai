const { validateEnvironment } = require('../config/validateEnv');

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should pass with valid environment variables', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.JWT_SECRET = 'a'.repeat(32);
    
    expect(() => validateEnvironment()).not.toThrow();
  });
});
