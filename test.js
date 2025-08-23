const fetch = require('node-fetch');

const BASE_URL = 'https://careerconnect-7af1.vercel.app';
const TEST_USER = {
    username: 'Test User',
    email: 'testuser@example.com',
    password: 'TestUser123!',
    role: 'jobseeker'
};

async function testHealthCheck() {
    try {
        console.log('Testing API Health...');
        const response = await fetch(`${BASE_URL}/api/health`);
        if (!response.ok) {
            throw new Error(`Health check failed with status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Health Check Response:', data);
        console.log('Status:', response.status);
        return true;
    } catch (error) {
        console.error('Health Check Failed:', error.message);
        return false;
    }
}

async function testRegistration() {
    console.log('\nTest 1: Registration Process');
    console.log('Sending registration request for:', TEST_USER.email);
    
    try {
        const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_USER)
        });

        const registerData = await registerResponse.json();
        console.log('\nRegistration Response:');
        console.log('Status Code:', registerResponse.status);
        console.log('Response Data:', JSON.stringify(registerData, null, 2));
        
        if (registerResponse.ok) {
            console.log('\n✅ Registration Successful!');
            return true;
        } else {
            console.log('\n❌ Registration Failed:', registerData.message);
            return false;
        }
    } catch (error) {
        console.error('\n❌ Registration Error:', error.message);
        return false;
    }
}

async function testLogin() {
    console.log('\nTest 2: Login Process');
    console.log('Attempting login with:', TEST_USER.email);
    
    try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password
            })
        });

        const loginData = await loginResponse.json();
        console.log('\nLogin Response:');
        console.log('Status Code:', loginResponse.status);
        console.log('Response Data:', JSON.stringify(loginData, null, 2));
        
        if (loginResponse.ok) {
            console.log('\n✅ Login Successful!');
            return loginData.token;
        } else {
            console.log('\n❌ Login Failed:', loginData.message);
            return null;
        }
    } catch (error) {
        console.error('\n❌ Login Error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting CareerConnect API Tests');
    console.log('----------------------------------------');
    console.log('Testing with user:', TEST_USER.username);
    console.log('----------------------------------------\n');

    // Test 1: Health Check
    const isHealthy = await testHealthCheck();
    if (!isHealthy) {
        console.log('❌ API is not healthy. Skipping remaining tests.');
        return;
    }
    console.log('✅ API is healthy. Proceeding with tests.\n');
    console.log('----------------------------------------');

    // Test 2: Registration
    const registrationSuccess = await testRegistration();
    console.log('----------------------------------------');

    // Test 3: Login (only if registration was successful)
    if (registrationSuccess) {
        const token = await testLogin();
        console.log('----------------------------------------');
        
        if (token) {
            console.log('✅ Full test suite completed successfully!');
        } else {
            console.log('❌ Login failed after successful registration.');
        }
    } else {
        console.log('❌ Skipping login test due to registration failure.');
    }
}

// Run the tests
runTests()
    .then(() => {
        console.log('\n✨ Test suite completed!');
    })
    .catch(error => {
        console.error('\n❌ Test suite error:', error.message);
    }); 