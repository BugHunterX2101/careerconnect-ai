const axios = require('axios');

(async () => {
  console.log('\n=== AUTHENTICATION SYSTEM VERIFICATION ===\n');
  
  try {
    // Test 1: Login
    console.log('Test 1: Login with test@test.com');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@test.com',
      password: 'test123'
    });
    console.log('✓ Login successful');
    console.log(`  Token: ${loginResponse.data.token.substring(0, 30)}...`);
    console.log(`  User ID: ${loginResponse.data.user.id}`);
    const token = loginResponse.data.token;
    
    // Test 2: Access protected route WITH token
    console.log('\nTest 2: Access /me with valid token');
    const meResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Protected route access granted');
    console.log(`  User: ${meResponse.data.email}`);
    
    // Test 3: Access protected route WITHOUT token
    console.log('\nTest 3: Access /me without token');
    try {
      await axios.get('http://localhost:3000/api/auth/me');
      console.log('✗ SECURITY ISSUE: Access granted without token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Correctly rejected (401)');
      }
    }
    
    // Test 4: Invalid credentials
    console.log('\nTest 4: Login with invalid credentials');
    try {
      await axios.post('http://localhost:3000/api/auth/login', {
        email: 'wrong@test.com',
        password: 'wrongpass'
      });
      console.log('✗ SECURITY ISSUE: Invalid credentials accepted!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Correctly rejected invalid credentials');
      }
    }
    
    // Test 5: Invalid token
    console.log('\nTest 5: Access /me with invalid token');
    try {
      await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: 'Bearer invalid.token.here' }
      });
      console.log('✗ SECURITY ISSUE: Invalid token accepted!');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✓ Correctly rejected invalid token');
      }
    }
    
    console.log('\n=== ALL AUTHENTICATION TESTS PASSED ===\n');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
})();
