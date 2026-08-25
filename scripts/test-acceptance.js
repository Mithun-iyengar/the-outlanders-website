// scripts/test-acceptance.js - Automated Critical Acceptance Test Script
const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }, token ? { 'Authorization': `Bearer ${token}` } : {})
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch(e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting Critical Acceptance Test...');

  // Step 1: Admin Login
  const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  console.log('Step 1: Admin Login -> Status:', loginRes.status);
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.token;
  console.log('✅ JWT Token received successfully.');

  // Step 2: Unauthenticated POST should fail with 401
  const unauthRes = await request('POST', '/treks', { name: 'Unauthorized Trek' });
  console.log('Step 2: Unauthenticated POST protection -> Status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error('Security Error: Unauthenticated POST was not rejected with 401!');
  }
  console.log('✅ Unauthenticated route protection verified.');

  // Step 3: Add "TEST OUTLANDERS TREK"
  const testTrek = {
    id: 'test-outlanders-trek',
    name: 'TEST OUTLANDERS TREK',
    category: 'Western Ghats',
    location: 'Chikkamagaluru, Karnataka',
    price: 2999,
    duration: '2 Days',
    difficulty: 'Easy',
    shortDescription: 'Temporary test trek for acceptance verification.',
    published: true
  };

  const createRes = await request('POST', '/treks', testTrek, token);
  console.log('Step 3: Create Trek -> Status:', createRes.status);
  if (createRes.status !== 201) {
    throw new Error('Failed to create test trek: ' + JSON.stringify(createRes.body));
  }
  console.log('✅ Created trek: "TEST OUTLANDERS TREK" with price ₹2999.');

  // Step 4: Verify Trek appears on Public GET /api/treks
  const listRes = await request('GET', '/treks');
  const found = listRes.body.find(t => t.id === 'test-outlanders-trek');
  if (!found) {
    throw new Error('Created trek not found in public GET /api/treks!');
  }
  console.log('✅ Verified trek appears in public API listing.');

  // Step 5: Edit Trek Price to 3499
  const updateRes = await request('PUT', '/treks/test-outlanders-trek', { price: 3499 }, token);
  console.log('Step 5: Update Trek Price -> Status:', updateRes.status);
  if (updateRes.status !== 200 || updateRes.body.price !== 3499) {
    throw new Error('Failed to update trek price: ' + JSON.stringify(updateRes.body));
  }
  console.log('✅ Updated trek price to ₹3499.');

  // Step 6: Verify updated price on Public GET /api/treks/test-outlanders-trek
  const getRes = await request('GET', '/treks/test-outlanders-trek');
  if (getRes.body.price !== 3499) {
    throw new Error('Updated price did not reflect in public GET endpoint!');
  }
  console.log('✅ Verified updated price ₹3499 in public trek details API.');

  // Step 7: Delete Trek
  const deleteRes = await request('DELETE', '/treks/test-outlanders-trek', null, token);
  console.log('Step 7: Delete Trek -> Status:', deleteRes.status);
  if (deleteRes.status !== 200) {
    throw new Error('Failed to delete trek: ' + JSON.stringify(deleteRes.body));
  }
  console.log('✅ Deleted test trek.');

  // Step 8: Verify Trek disappears from Public Listing
  const finalRes = await request('GET', '/treks');
  const finalFound = finalRes.body.find(t => t.id === 'test-outlanders-trek');
  if (finalFound) {
    throw new Error('Deleted trek is still present in public listing!');
  }
  console.log('✅ Verified trek removed from public website API.');

  console.log('🎉 ALL CRITICAL ACCEPTANCE TESTS PASSED 100%!');
}

runTest().catch(err => {
  console.error('❌ Acceptance Test Failed:', err);
  process.exit(1);
});
