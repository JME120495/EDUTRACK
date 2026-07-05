// Test: check if the deployed API has the updated JWT expiry (7d) by checking response headers and behavior
const API = 'https://edutrack-api-1du4.onrender.com/api';

async function test() {
  console.log('=== Deployed API Version Check ===\n');

  // 1. Check health
  try {
    const healthRes = await fetch(API.replace('/api', '/health'));
    const healthData = await healthRes.json().catch(() => null);
    console.log('Health:', healthRes.status, JSON.stringify(healthData));
  } catch(e) {
    console.log('Health FAIL:', e.message);
  }

  // 2. Test with a completely invalid token to verify the error differentiation
  console.log('\n--- Test 1: Completely invalid token ---');
  try {
    const res = await fetch(`${API}/creneaux`, {
      headers: { 'Authorization': 'Bearer totally-invalid-token' }
    });
    const data = await res.json();
    console.log('Status:', res.status, '| Message:', data.message);
    // If we get "Invalid or expired token" -> JWT error (expected)
    // If we get "Internal server error during authentication" -> DB error (new behavior)
  } catch(e) {
    console.log('Error:', e.message);
  }

  // 3. Test with no token
  console.log('\n--- Test 2: No token ---');
  try {
    const res = await fetch(`${API}/creneaux`);
    const data = await res.json();
    console.log('Status:', res.status, '| Message:', data.message);
  } catch(e) {
    console.log('Error:', e.message);
  }

  // 4. Test with an expired-looking but well-formed token (signed with our local secret)
  console.log('\n--- Test 3: Well-formed token with local secret ---');
  const jwt = require('jsonwebtoken');
  const localSecret = 'edutrack-super-secret-jwt-key-24h-2026';
  const testToken = jwt.sign({ userId: 'test', role: 'DIRECTOR' }, localSecret, { expiresIn: '1h' });
  
  try {
    const res = await fetch(`${API}/creneaux`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const data = await res.json();
    console.log('Status:', res.status, '| Message:', data.message);
    if (res.status === 401 && data.message === 'Invalid or expired token') {
      console.log('=> The Render server uses a DIFFERENT JWT_SECRET than local!');
      console.log('   This is likely the root cause of the user\'s "Invalid or expired token" error.');
      console.log('   The JWT_SECRET on Render needs to be set to:', localSecret);
    } else if (res.status === 401 && data.message === 'User no longer exists') {
      console.log('=> The secrets MATCH! Token was decoded but user ID "test" does not exist.');
    } else if (res.status === 500) {
      console.log('=> The secrets MATCH! But DB lookup failed (expected for fake userId).');
    } else {
      console.log('=> Unexpected response. Needs investigation.');
    }
  } catch(e) {
    console.log('Error:', e.message);
  }

  console.log('\n=== Done ===');
}

test();
