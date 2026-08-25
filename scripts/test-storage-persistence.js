// scripts/test-storage-persistence.js - Full End-to-End Image Persistence Test
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runStoragePersistenceTest() {
  console.log('🧪 Starting Full Image Upload & Persistence Verification Test...\n');

  // 1. Admin Login
  console.log('Step 1: Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'outlanders2026' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, 'Admin login failed');
  assert.ok(loginData.token, 'Token missing');
  const token = loginData.token;
  console.log('✅ Admin login successful.\n');

  // 2. Upload Sample Image
  console.log('Step 2: Uploading sample image to /api/upload...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      base64: sampleBase64,
      filename: `persistence-test-${Date.now()}.png`,
      folder: 'treks'
    })
  });
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201, `Upload failed: ${JSON.stringify(uploadData)}`);
  assert.ok(uploadData.url || uploadData.fullUrl, 'Upload response missing URL');

  const uploadedUrl = uploadData.url || uploadData.fullUrl;
  console.log(`✅ Image upload successful.`);
  console.log(`👉 Returned URL: ${uploadedUrl}`);
  console.log(`👉 Provider: ${uploadData.provider}\n`);

  // 3. Save Trek Record with Uploaded Image URL
  const testTrekId = `storage-trek-${Date.now()}`;
  console.log(`Step 3: Creating Trek record (${testTrekId}) with uploaded image...`);
  const trekPayload = {
    id: testTrekId,
    name: 'Storage Test Trek',
    category: 'Western Ghats',
    price: 3500,
    published: true,
    image: uploadedUrl,
    coverImage: uploadedUrl,
    shortDescription: 'Testing Supabase storage image persistence.'
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
  console.log('✅ Trek saved successfully.\n');

  // 4. Retrieve Saved Trek and Verify Image Persistence
  console.log('Step 4: Fetching saved trek to verify image persistence...');
  const getRes = await fetch(`${API_BASE}/treks/${testTrekId}`);
  const trekObj = await getRes.json();
  assert.strictEqual(getRes.status, 200, 'Fetch trek failed');
  assert.strictEqual(trekObj.image, uploadedUrl, 'Persisted image URL does not match uploaded URL!');
  assert.strictEqual(trekObj.coverImage, uploadedUrl, 'Persisted coverImage URL does not match uploaded URL!');
  console.log('✅ Image URL persisted perfectly in database record!');
  console.log(`👉 Retrieved Image URL: ${trekObj.image}\n`);

  // 5. Cleanup Test Record
  console.log('Step 5: Cleaning up test trek record...');
  const delRes = await fetch(`${API_BASE}/treks/${testTrekId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(delRes.status, 200, 'Delete test trek failed');
  console.log('✅ Cleanup successful.\n');

  console.log('🎉 FULL STORAGE PERSISTENCE TEST PASSED PERFECTLY!');
}

runStoragePersistenceTest().catch(err => {
  console.error('❌ Storage persistence test failed:', err);
  process.exit(1);
});
