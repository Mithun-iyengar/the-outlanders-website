// scripts/test-phase6-memories.js - Automated Test for Phase 6 Memories Module
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

async function testPhase6Memories() {
  console.log('📸 Starting Phase 6 Memories Gallery Module Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin login successful.');

  // Step 2: Fetch Existing Memories
  const memRes1 = await api('GET', '/memories');
  const initialMemories = memRes1.data;
  console.log(`✅ Step 2: Viewed existing memories (${initialMemories.length} items in database).`);

  // Step 3: Add single memory and bulk update memories
  const testMemId = 'mem-test-phase6-' + Date.now();
  const newMemory = {
    id: testMemId,
    image: '../images/treks/kudremukha/cover.jpg',
    category: 'Western Ghats',
    order: 999,
    published: true,
    created_at: Date.now()
  };

  const updatedMemoriesList = [newMemory, ...initialMemories];
  const saveRes = await api('PUT', '/memories', updatedMemoriesList, token);
  if (saveRes.status !== 200) throw new Error('Save memories failed');
  console.log('✅ Step 3: Saved memories gallery list via PUT /api/memories.');

  // Step 4: Verify public API returns new memory
  const memRes2 = await api('GET', '/memories');
  const foundMem = memRes2.data.find(m => m.id === testMemId);
  if (!foundMem) throw new Error('New memory missing from public GET /api/memories');
  console.log('✅ Step 4: Verified new memory is live on public API.');

  // Step 5: Restore original memories list
  await api('PUT', '/memories', initialMemories, token);
  const memRes3 = await api('GET', '/memories');
  if (memRes3.data.find(m => m.id === testMemId)) throw new Error('Failed to clean up test memory!');
  console.log('✅ Step 5: Restored original memories gallery list. Cleanup complete.');

  console.log('\n🎉 ALL PHASE 6 MEMORIES GALLERY MODULE TESTS PASSED 100% PERFECTLY!');
}

testPhase6Memories().catch(err => {
  console.error('❌ Phase 6 Test Failed:', err);
  process.exit(1);
});
