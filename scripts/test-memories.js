// scripts/test-memories.js - Automated Test for Memories Gallery CRUD & Persistence
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

async function testMemories() {
  console.log('🧪 Testing Memories Gallery API & Persistence...');

  // 1. Login to get auth token
  const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.body.token;

  // 2. Fetch initial memories
  const getRes1 = await request('GET', '/memories');
  console.log('Initial memories count:', getRes1.body.length);

  // 3. Add a memory
  const newMem = {
    id: 'test-mem-1',
    image: '../images/uploads/test-memory.jpg',
    category: 'Western Ghats',
    order: 1,
    published: true,
    created_at: Date.now()
  };

  const currentList = getRes1.body || [];
  currentList.unshift(newMem);

  const saveRes = await request('PUT', '/memories', currentList, token);
  console.log('Save memories API status:', saveRes.status);
  if (saveRes.status !== 200) {
    throw new Error('Save memories failed: ' + JSON.stringify(saveRes.body));
  }

  // 4. Fetch memories and verify
  const getRes2 = await request('GET', '/memories');
  const found = getRes2.body.find(m => m.id === 'test-mem-1');
  if (!found) {
    throw new Error('Saved memory not found in GET /api/memories');
  }
  console.log('✅ Memory created and verified:', found);

  // 5. Clean up test memory
  const cleanedList = getRes2.body.filter(m => m.id !== 'test-mem-1');
  await request('PUT', '/memories', cleanedList, token);
  console.log('✅ Cleaned up test memory.');

  console.log('🎉 ALL MEMORIES GALLERY TESTS PASSED 100%!');
}

testMemories().catch(err => {
  console.error('❌ Memories Test Failed:', err);
  process.exit(1);
});
