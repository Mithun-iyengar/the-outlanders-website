// scripts/test-storage-persistence.js - Full End-to-End Secure Image Persistence & Authorization Test
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runSecureStorageTest() {
  console.log('🧪 Starting Full Secure Image Upload & Persistence Verification Test...\n');

  // Check 1: Unauthorized Upload Rejected with 401
  console.log('Check 1: Testing unauthorized upload without JWT token...');
  const unauthRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
  });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated upload MUST be rejected with 401 Unauthorized');
  console.log('✅ PASS: Unauthorized upload rejected with 401 Unauthorized.\n');

  // Check 2: Admin Login
  console.log('Check 2: Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'outlanders2026' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, 'Admin login failed');
  assert.ok(loginData.token, 'Token missing');
  const token = loginData.token;
  console.log('✅ PASS: Admin login successful & JWT token obtained.\n');

  // Check 3: Upload Image as Logged-In Admin
  console.log('Check 3: Uploading sample image as authenticated admin...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      base64: sampleBase64,
      filename: `secure-test-${Date.now()}.png`,
      folder: 'treks'
    })
  });
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201, `Upload failed: ${JSON.stringify(uploadData)}`);
  assert.ok(uploadData.url || uploadData.fullUrl, 'Upload response missing URL');

  const uploadedUrl = uploadData.url || uploadData.fullUrl;
  console.log(`✅ PASS: Authenticated image upload successful.`);
  console.log(`👉 Returned URL: ${uploadedUrl}`);
  console.log(`👉 Provider: ${uploadData.provider}\n`);

  // Check 4: Save Trek Record with Uploaded Image URL
  const testTrekId = `secure-trek-${Date.now()}`;
  console.log(`Check 4: Creating Trek record (${testTrekId}) with uploaded image...`);
  const trekPayload = {
    id: testTrekId,
    name: 'Secure Storage Test Trek',
    category: 'Western Ghats',
    price: 4999,
    published: true,
    image: uploadedUrl,
    coverImage: uploadedUrl,
    shortDescription: 'Testing secure Supabase storage image persistence.'
  };

  const saveRes = await fetch(`${API_BASE}/treks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(trekPayload)
  });
  assert.ok(saveRes.status === 200 || saveRes.status === 201, 'Save trek failed');
  const savedTrek = await saveRes.json();
  const actualTrekId = savedTrek.id || testTrekId;
  console.log('✅ PASS: Trek saved successfully into database.\n');

  // Check 5: Retrieve Saved Trek (Simulating Admin Refresh & Frontend Fetch)
  console.log('Check 5: Fetching saved trek to verify image persistence across Admin & Frontend...');
  const getRes = await fetch(`${API_BASE}/treks/${actualTrekId}`);
  const trekObj = await getRes.json();
  assert.strictEqual(getRes.status, 200, 'Fetch trek failed');
  assert.strictEqual(trekObj.image, uploadedUrl, 'Persisted image URL does not match uploaded URL!');
  assert.strictEqual(trekObj.coverImage, uploadedUrl, 'Persisted coverImage URL does not match uploaded URL!');
  console.log('✅ PASS: Image URL persisted perfectly in database record!');
  console.log(`👉 Retrieved Image URL: ${trekObj.image}\n`);

  // Check 6: Verify No Secret / Service Role Key Leakage in Frontend Files
  console.log('Check 6: Auditing frontend files for secret / service_role key leakage...');
  const frontendDir = path.join(__dirname, '../frontend');
  const adminDir = path.join(__dirname, '../admin');
  
  function checkNoSecrets(dir) {
    const files = fs.readdirSync(dir, { recursive: true });
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isFile() && (f.endsWith('.js') || f.endsWith('.html'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.strictEqual(content.includes('SUPABASE_SERVICE_ROLE_KEY'), false, `Secret leaked in ${f}`);
        assert.strictEqual(content.includes('service_role'), false, `Service role leaked in ${f}`);
      }
    }
  }
  checkNoSecrets(frontendDir);
  checkNoSecrets(adminDir);
  console.log('✅ PASS: ZERO secrets or service_role keys exposed in frontend or admin code.\n');

  // Check 7: Memories CMS Upload & Database Persistence Flow
  console.log('Check 7: Testing Memories CMS Upload & Database Persistence Flow...');
  const memUploadRes = await fetch(`${API_BASE}/upload?folder=memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      base64: sampleBase64,
      filename: `memory-test-${Date.now()}.png`,
      folder: 'memories'
    })
  });
  const memUploadData = await memUploadRes.json();
  assert.strictEqual(memUploadRes.status, 201, `Memories image upload failed: ${JSON.stringify(memUploadData)}`);
  const memImgUrl = memUploadData.url || memUploadData.fullUrl;
  assert.ok(memImgUrl, 'Memories upload missing URL');
  console.log(`✅ PASS: Memories image uploaded successfully (${memImgUrl}).`);

  const testMemId = `mem-e2e-${Date.now()}`;
  const getInitialMemRes = await fetch(`${API_BASE}/memories`);
  const initialMemories = await getInitialMemRes.json();

  const newMemItem = {
    id: testMemId,
    image: memImgUrl,
    category: 'Western Ghats',
    order: 1,
    published: true,
    created_at: Date.now()
  };

  const putMemRes = await fetch(`${API_BASE}/memories`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify([newMemItem, ...initialMemories])
  });
  assert.strictEqual(putMemRes.status, 200, 'PUT /api/memories failed');

  const getReloadedMemRes = await fetch(`${API_BASE}/memories?t=${Date.now()}`);
  const reloadedMemories = await getReloadedMemRes.json();
  const foundMem = reloadedMemories.find(m => m.id === testMemId);
  assert.ok(foundMem, 'Saved memory item not found on reload');
  assert.strictEqual(foundMem.image, memImgUrl, 'Persisted memories.image URL does not match uploaded URL!');
  console.log('✅ PASS: Memories item and image URL persisted perfectly across Admin & Frontend.\n');

  // Check 8: Cleanup Test Records
  console.log('Check 8: Cleaning up test records...');
  const delRes = await fetch(`${API_BASE}/treks/${actualTrekId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(delRes.status, 200, 'Delete test trek failed');

  const delMemRes = await fetch(`${API_BASE}/memories/${testMemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(delMemRes.status, 200, 'Delete test memory failed');
  console.log('✅ PASS: Cleanup successful.\n');

  console.log('🎉 ALL SECURE STORAGE & MEMORIES PERSISTENCE CHECKS PASSED PERFECTLY!');
}

runSecureStorageTest().catch(err => {
  console.error('❌ Secure storage verification failed:', err);
  process.exit(1);
});
