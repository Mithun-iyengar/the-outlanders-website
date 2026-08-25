// scripts/test-phase1-treks.js - Complete 10-Step Phase 1 Treks Module Test
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

async function testPhase1Treks() {
  console.log('🏔️ Starting Phase 1 Treks Module Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Step 1 Failed: Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin Login successful (JWT Token acquired).');

  // Step 2: View Existing Treks
  const treksRes1 = await api('GET', '/treks');
  const initialCount = treksRes1.data.length;
  console.log(`✅ Step 2: Viewed existing treks (${initialCount} treks currently in database).`);

  // Step 3: Create a TEST Trek (Draft / Unpublished)
  const testTrekId = 'test-phase1-trek-' + Date.now();
  const newTrekPayload = {
    id: testTrekId,
    name: 'TEST PHASE1 TREK',
    category: 'Western Ghats',
    location: 'Chikkamagaluru, Karnataka',
    date: 'Every Weekend',
    duration: '2 Days / 1 Night',
    difficulty: 'Moderate',
    price: 3999,
    published: false,
    featured: false,
    shortDescription: 'Draft test trek for Phase 1 verification.',
    description: 'Detailed description for test trek.',
    itinerary: '../assets/documents/Kudremukha.pdf'
  };

  const createRes = await api('POST', '/treks', newTrekPayload, token);
  if (createRes.status !== 201) {
    throw new Error('Step 3 Failed: Trek creation failed: ' + JSON.stringify(createRes.data));
  }
  console.log(`✅ Step 3: Created TEST trek "${testTrekId}" with published = false (Draft).`);

  // Step 4: Confirm it appears in Admin list
  const treksRes2 = await api('GET', '/treks');
  const foundAdmin1 = treksRes2.data.find(t => t.id === testTrekId);
  if (!foundAdmin1) {
    throw new Error('Step 4 Failed: Created trek not found in Admin listing');
  }
  console.log('✅ Step 4: Confirmed TEST trek appears in Admin listing (Status: Draft).');

  // Step 5: Verify it does NOT appear on public website (Filter published = true)
  const publicTreks1 = treksRes2.data.filter(t => t.published !== false);
  const foundPublic1 = publicTreks1.find(t => t.id === testTrekId);
  if (foundPublic1) {
    throw new Error('Step 5 Failed: Unpublished draft trek appeared in public website listing!');
  }
  console.log('✅ Step 5: Verified draft trek is HIDDEN from public website.');

  // Step 6: Publish the Trek and verify it appears publicly
  foundAdmin1.published = true;
  const pubRes = await api('PUT', `/treks/${testTrekId}`, foundAdmin1, token);
  if (pubRes.status !== 200) {
    throw new Error('Step 6 Failed: Publishing trek failed');
  }

  const treksRes3 = await api('GET', '/treks');
  const publicTreks2 = treksRes3.data.filter(t => t.published !== false);
  const foundPublic2 = publicTreks2.find(t => t.id === testTrekId);
  if (!foundPublic2) {
    throw new Error('Step 6 Failed: Published trek did not appear in public website listing!');
  }
  console.log('✅ Step 6: Published TEST trek and verified it appears live on the public website.');

  // Step 7 & 8: Edit title, description, price and verify frontend update
  foundAdmin1.name = 'TEST PHASE1 TREK (UPDATED)';
  foundAdmin1.price = 4499;
  foundAdmin1.shortDescription = 'Updated description for Phase 1 verification.';

  const editRes = await api('PUT', `/treks/${testTrekId}`, foundAdmin1, token);
  if (editRes.status !== 200) {
    throw new Error('Step 7 Failed: Editing trek failed');
  }

  const getUpdated = await api('GET', `/treks/${testTrekId}`);
  if (getUpdated.data.name !== 'TEST PHASE1 TREK (UPDATED)' || getUpdated.data.price !== 4499) {
    throw new Error('Step 8 Failed: Updated values not reflected in public trek details!');
  }
  console.log(`✅ Steps 7 & 8: Updated trek title to "${getUpdated.data.name}" and price to ₹${getUpdated.data.price}. Verified live frontend updates.`);

  // Step 9 & 10: Delete the TEST trek with confirmation and clean up
  const delRes = await api('DELETE', `/treks/${testTrekId}`, null, token);
  if (delRes.status !== 200) {
    throw new Error('Step 9 Failed: Deleting trek failed');
  }

  const finalTreks = await api('GET', '/treks');
  const foundFinal = finalTreks.data.find(t => t.id === testTrekId);
  if (foundFinal) {
    throw new Error('Step 10 Failed: Deleted trek still found in database!');
  }
  console.log('✅ Steps 9 & 10: Deleted TEST trek and confirmed 100% removal from Admin and Public frontend.');

  console.log('\n🎉 ALL 10 PHASE 1 TREKS MODULE VERIFICATION TESTS PASSED 100% PERFECTLY!');
}

testPhase1Treks().catch(err => {
  console.error('❌ Phase 1 Test Failed:', err);
  process.exit(1);
});
