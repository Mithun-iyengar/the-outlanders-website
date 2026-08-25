// scripts/test-phase5-storage.js - Automated Test for Phase 5 Storage & Media Management
const http = require('http');

function apiUploadBase64(base64Data, filename, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ base64: base64Data, filename: filename });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`
      }
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
    req.write(payload);
    req.end();
  });
}

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

async function testPhase5Storage() {
  console.log('📦 Starting Phase 5 Storage & Media Management Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin login successful.');

  // Step 2: Upload a sample image file payload
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testFilename = 'test-phase5-storage-' + Date.now() + '.png';

  const uploadRes = await apiUploadBase64(dummyBase64, testFilename, token);
  if (uploadRes.status !== 201 || !uploadRes.data.url) {
    throw new Error('Image upload failed: ' + JSON.stringify(uploadRes.data));
  }
  console.log(`✅ Step 2: Uploaded sample file "${testFilename}" -> ${uploadRes.data.url}.`);

  // Step 3: Verify unauthenticated upload is BLOCKED (401)
  const unauthRes = await apiUploadBase64(dummyBase64, 'unauth-' + testFilename, null);
  if (unauthRes.status !== 401 && unauthRes.status !== 403) {
    throw new Error('Unauthenticated upload was NOT blocked! Status: ' + unauthRes.status);
  }
  console.log('✅ Step 3: Verified unauthenticated upload attempt is BLOCKED (401 Unauthorized).');

  console.log('\n🎉 ALL PHASE 5 STORAGE & MEDIA MANAGEMENT TESTS PASSED 100% PERFECTLY!');
}

testPhase5Storage().catch(err => {
  console.error('❌ Phase 5 Test Failed:', err);
  process.exit(1);
});
