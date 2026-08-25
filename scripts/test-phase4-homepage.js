// scripts/test-phase4-homepage.js - Automated Test for Phase 4 Homepage Content Module
const http = require('http');

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0
      }, token ? { 'Authorization': `Bearer ${token}` } : {})
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch(e) {
          resolve({ status: res.statusCode, data: buf });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function testPhase4Homepage() {
  console.log('🏠 Starting Phase 4 Homepage Content Module Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin login successful.');

  // Step 2: Fetch Original Homepage Content
  const hpOriginal = await api('GET', '/homepage');
  console.log('✅ Step 2: Fetched live homepage content from API.');

  // Step 3: Update a heading temporarily
  const modifiedHp = JSON.parse(JSON.stringify(hpOriginal.data));
  const origTitle = modifiedHp.hero ? modifiedHp.hero.title : 'EXPLORE BEYOND THE ORDINARY';
  
  modifiedHp.hero = modifiedHp.hero || {};
  modifiedHp.hero.title = 'TEST PHASE4 EXPLORE TITLE';

  const updateRes = await api('PUT', '/homepage', modifiedHp, token);
  if (updateRes.status !== 200) throw new Error('Update homepage failed');
  console.log('✅ Step 3: Temporarily updated hero title to "TEST PHASE4 EXPLORE TITLE".');

  // Step 4: Verify frontend API reflects updated heading
  const hpUpdated = await api('GET', '/homepage');
  if (!hpUpdated.data.hero || hpUpdated.data.hero.title !== 'TEST PHASE4 EXPLORE TITLE') {
    throw new Error('Updated hero title not reflected in GET /api/homepage');
  }
  console.log('✅ Step 4: Verified live API returns updated hero title.');

  // Step 5: Restore original homepage content
  modifiedHp.hero.title = origTitle;
  await api('PUT', '/homepage', modifiedHp, token);

  const hpRestored = await api('GET', '/homepage');
  if (hpRestored.data.hero.title !== origTitle) {
    throw new Error('Failed to restore original hero title!');
  }
  console.log(`✅ Step 5: Restored original hero title "${origTitle}". Cleanup complete.`);

  console.log('\n🎉 ALL PHASE 4 HOMEPAGE CONTENT MODULE TESTS PASSED 100% PERFECTLY!');
}

testPhase4Homepage().catch(err => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
