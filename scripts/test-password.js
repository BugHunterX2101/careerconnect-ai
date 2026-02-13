// Test password comparison
const bcrypt = require('bcryptjs');

async function testPassword() {
  const plainPassword = 'test123';
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hashedPassword);
  
  // Test comparison
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Does "test123" match?', isMatch);
  
  const isWrong = await bcrypt.compare('wrongpassword', hashedPassword);
  console.log('Does "wrongpassword" match?', isWrong);
}

testPassword();
