// Test OAuth Configuration
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOAuthSetup() {
  console.log('\n=== OAuth Configuration Test ===\n');
  
  try {
    // Test auth endpoint
    const authTest = await axios.get(`${BASE_URL}/api/auth/test`);
    console.log('✓ Backend is responding\n');
    
    // Check OAuth providers
    const oauth = authTest.data.oauth;
    
    console.log('OAuth Providers Status:');
    console.log('━'.repeat(50));
    
    // Google
    if (oauth.google && oauth.google.hasStrategy) {
      console.log('✓ Google OAuth: CONFIGURED');
      console.log('  Callback URL: http://localhost:3000/api/auth/google/callback');
    } else {
      console.log('✗ Google OAuth: NOT CONFIGURED');
    }
    
    // LinkedIn
    if (oauth.linkedin && oauth.linkedin.configured) {
      console.log('\n✓ LinkedIn OAuth: CONFIGURED');
      console.log('  Client ID:', oauth.linkedin.clientId);
      console.log('  Callback URL:', oauth.linkedin.callbackUrl);
    } else {
      console.log('\n✗ LinkedIn OAuth: NOT CONFIGURED');
    }
    
    // GitHub
    if (oauth.github && oauth.github.hasRoutes) {
      console.log('\n✓ GitHub OAuth: CONFIGURED');
      console.log('  Callback URL: http://localhost:3000/api/auth/github/callback');
    } else {
      console.log('\n✗ GitHub OAuth: NOT CONFIGURED');
    }
    
    console.log('\n' + '━'.repeat(50));
    console.log('\nOAuth Login URLs:');
    console.log('━'.repeat(50));
    console.log('Google:   http://localhost:3000/api/auth/google');
    console.log('LinkedIn: http://localhost:3000/api/auth/linkedin');
    console.log('GitHub:   http://localhost:3000/api/auth/github');
    
    console.log('\n\nIMPORTANT - Configure these callback URLs in OAuth provider consoles:');
    console.log('━'.repeat(50));
    console.log('\n1. Google Cloud Console (https://console.cloud.google.com/):');
    console.log('   Authorized redirect URIs:');
    console.log('   → http://localhost:3000/api/auth/google/callback');
    
    console.log('\n2. LinkedIn Developer Portal (https://www.linkedin.com/developers/):');
    console.log('   Redirect URLs:');
    console.log('   → http://localhost:3000/api/auth/linkedin/callback');
    
    console.log('\n3. GitHub OAuth Apps (https://github.com/settings/developers):');
    console.log('   Authorization callback URL:');
    console.log('   → http://localhost:3000/api/auth/github/callback');
    
    console.log('\n' + '━'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nBackend is not running. Please start it first.');
    }
  }
}

testOAuthSetup();
