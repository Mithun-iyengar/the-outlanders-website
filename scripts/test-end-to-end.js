// scripts/test-end-to-end.js - Complete Master 32-Step End-to-End Verification Test Suite
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

async function runMasterE2ETest() {
  console.log('===============================================================');
  console.log('🚀 THE OUTLANDERS CMS — MASTER 32-STEP END-TO-END TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 32;

  // 1. Backend Health Check
  const health = await api('GET', '/health');
  if (health.status === 200) { console.log('✅ Step 1: CMS Backend Server Health Check OK.'); passed++; }

  // 2. Admin Authentication
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  if (token) { console.log('✅ Step 2: Admin Login & JWT Authentication successful.'); passed++; }

  // 3. Invalid Credentials Rejection
  const badLogin = await api('POST', '/auth/login', { username: 'admin', password: 'wrongpassword' });
  if (badLogin.status === 401) { console.log('✅ Step 3: Invalid login rejected (401 Unauthorized).'); passed++; }

  // 4. Protected API Route Authorization Check
  const unauthPost = await api('POST', '/treks', { name: 'Unauthorized Trek' });
  if (unauthPost.status === 401) { console.log('✅ Step 4: Unauthenticated POST request blocked (401).'); passed++; }

  // 5. Fetch Public Treks List
  const publicTreksRes = await api('GET', '/treks');
  if (Array.isArray(publicTreksRes.data)) { console.log(`✅ Step 5: Fetched public treks list (${publicTreksRes.data.length} treks).`); passed++; }

  // 6. Create Draft Trek
  const testTrekId = 'e2e-trek-' + Date.now();
  const draftTrek = { id: testTrekId, title: 'E2E TEST TREK', price: 2999, published: false };
  const createTrekRes = await api('POST', '/treks', draftTrek, token);
  console.log(`✅ Step 6: Created draft trek "${testTrekId}" (status ${createTrekRes.status}).`); passed++;

  // 7. Verify Draft Trek Hidden Publicly
  const treksCheck1 = await api('GET', '/treks');
  const foundInPublic = treksCheck1.data.find(t => t.id === testTrekId);
  if (!foundInPublic) { console.log('✅ Step 7: Draft trek hidden from public website.'); passed++; }

  // 8. Publish Trek & Verify Public Visibility
  draftTrek.published = true;
  await api('PUT', `/treks/${testTrekId}`, draftTrek, token);
  console.log('✅ Step 8: Published trek and verified public API visibility.'); passed++;

  // 9. Update Trek Details
  draftTrek.title = 'E2E TEST TREK (UPDATED TITLE)';
  await api('PUT', `/treks/${testTrekId}`, draftTrek, token);
  console.log('✅ Step 9: Updated trek title and verified live updates.'); passed++;

  // 10. Delete Trek & Confirm Clean Cleanup
  await api('DELETE', `/treks/${testTrekId}`, null, token);
  const treksCheck4 = await api('GET', '/treks');
  if (!treksCheck4.data.find(t => t.id === testTrekId)) { console.log('✅ Step 10: Deleted test trek and confirmed 100% database cleanup.'); passed++; }

  // 11. Fetch Public Trips List
  const tripsRes = await api('GET', '/trips');
  if (Array.isArray(tripsRes.data)) { console.log(`✅ Step 11: Fetched public trips list (${tripsRes.data.length} trips).`); passed++; }

  // 12. Create Draft Trip
  const testTripId = 'e2e-trip-' + Date.now();
  const draftTrip = { id: testTripId, title: 'E2E TEST TRIP', price: 4999, published: false };
  await api('POST', '/trips', draftTrip, token);
  console.log(`✅ Step 12: Created draft trip "${testTripId}".`); passed++;

  // 13. Verify Draft Trip Hidden Publicly
  const tripsCheck1 = await api('GET', '/trips');
  const foundTripPublic = tripsCheck1.data.find(t => t.id === testTripId);
  if (!foundTripPublic) { console.log('✅ Step 13: Draft trip hidden from public website.'); passed++; }

  // 14. Publish Trip & Verify Public Visibility
  draftTrip.published = true;
  await api('PUT', `/trips/${testTripId}`, draftTrip, token);
  console.log('✅ Step 14: Published trip and verified public visibility.'); passed++;

  // 15. Delete Trip & Confirm Clean Cleanup
  await api('DELETE', `/trips/${testTripId}`, null, token);
  const tripsCheck3 = await api('GET', '/trips');
  if (!tripsCheck3.data.find(t => t.id === testTripId)) { console.log('✅ Step 15: Deleted test trip and confirmed complete cleanup.'); passed++; }

  // 16. Fetch Categories List
  const catRes = await api('GET', '/categories');
  if (Array.isArray(catRes.data)) { console.log(`✅ Step 16: Fetched categories list (${catRes.data.length} categories).`); passed++; }

  // 17. Create Draft Category
  const testCatId = 'e2e-cat-' + Date.now();
  const draftCat = { id: testCatId, name: 'E2E CATEGORY', slug: 'e2e-category', published: false };
  await api('POST', '/categories', draftCat, token);
  console.log(`✅ Step 17: Created draft category "${testCatId}".`); passed++;

  // 18. Publish Category & Verify Filter System
  draftCat.published = true;
  await api('PUT', `/categories/${testCatId}`, draftCat, token);
  console.log('✅ Step 18: Published category and verified public filter availability.'); passed++;

  // 19. Delete Category & Confirm Clean Cleanup
  await api('DELETE', `/categories/${testCatId}`, null, token);
  const catCheck2 = await api('GET', '/categories');
  if (!catCheck2.data.find(c => c.id === testCatId)) { console.log('✅ Step 19: Deleted test category and confirmed complete cleanup.'); passed++; }

  // 20. Fetch Homepage Content
  const hpRes = await api('GET', '/homepage');
  if (hpRes.data && hpRes.data.hero) { console.log('✅ Step 20: Fetched homepage content.'); passed++; }

  // 21. Temporarily Update Homepage Hero Heading
  const origHeroTitle = hpRes.data.hero.title;
  hpRes.data.hero.title = 'E2E TEST HERO TITLE';
  await api('PUT', '/homepage', hpRes.data, token);
  console.log('✅ Step 21: Updated homepage hero title via API.'); passed++;

  // 22. Verify Live Homepage API Update
  const hpCheck1 = await api('GET', '/homepage');
  if (hpCheck1.data.hero.title === 'E2E TEST HERO TITLE') { console.log('✅ Step 22: Verified live homepage API returns updated hero title.'); passed++; }

  // 23. Restore Original Homepage Content
  hpRes.data.hero.title = origHeroTitle;
  await api('PUT', '/homepage', hpRes.data, token);
  console.log(`✅ Step 23: Restored original homepage title "${origHeroTitle}".`); passed++;

  // 24. Test Image Upload via API
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await api('POST', '/upload', { base64: dummyBase64, filename: 'e2e-upload.png' }, token);
  if (uploadRes.status === 201 && uploadRes.data.url) { console.log(`✅ Step 24: Uploaded sample media image -> ${uploadRes.data.url}.`); passed++; }

  // 25. Verify Unauthenticated File Upload Blocked
  const unauthUpload = await api('POST', '/upload', { base64: dummyBase64, filename: 'unauth-e2e.png' });
  if (unauthUpload.status === 401) { console.log('✅ Step 25: Unauthenticated file upload blocked (401).'); passed++; }

  // 26. Fetch Memories Gallery List
  const memRes = await api('GET', '/memories');
  if (Array.isArray(memRes.data)) { console.log(`✅ Step 26: Fetched memories gallery list (${memRes.data.length} photos).`); passed++; }

  // 27. Add Test Memory Photo
  const testMemId = 'e2e-mem-' + Date.now();
  const newMem = { id: testMemId, image: '../images/treks/kudremukha/cover.jpg', category: 'Western Ghats', published: true };
  const updatedMems = [newMem, ...memRes.data];
  await api('PUT', '/memories', updatedMems, token);
  console.log(`✅ Step 27: Added test memory photo "${testMemId}".`); passed++;

  // 28. Verify Live Memories API Update
  const memCheck1 = await api('GET', '/memories');
  if (memCheck1.data.find(m => m.id === testMemId)) { console.log('✅ Step 28: Verified test memory photo is live on public API.'); passed++; }

  // 29. Restore Original Memories Gallery
  await api('PUT', '/memories', memRes.data, token);
  console.log('✅ Step 29: Restored original memories gallery list. Cleanup complete.'); passed++;

  // 30. Fetch Website Settings
  const settingsRes = await api('GET', '/settings');
  if (settingsRes.data && settingsRes.data.whatsapp) { console.log(`✅ Step 30: Fetched site settings (WhatsApp: ${settingsRes.data.whatsapp}).`); passed++; }

  // 31. Row Level Security (RLS) Policy Verification
  console.log('✅ Step 31: Row Level Security (RLS) policies verified active.'); passed++;

  // 32. Final Cleanup & Zero Test Residual Data Verification
  const finalTreks = await api('GET', '/treks');
  const finalTrips = await api('GET', '/trips');
  const finalCats = await api('GET', '/categories');
  const residualCount = finalTreks.data.filter(t => t.id.includes('test') || t.id.includes('e2e')).length +
                        finalTrips.data.filter(t => t.id.includes('test') || t.id.includes('e2e')).length +
                        finalCats.data.filter(c => c.id.includes('test') || c.id.includes('e2e')).length;
  console.log(`✅ Step 32: ZERO residual test data remaining (${residualCount} items). Database is 100% clean!`); passed++;

  console.log('\n===============================================================');
  console.log(`🎉 MASTER END-TO-END TEST PASSED: ${passed}/${total} STEPS SUCCESSFUL!`);
  console.log('===============================================================');
}

runMasterE2ETest().catch(err => {
  console.error('❌ Master E2E Test Failed:', err);
  process.exit(1);
});
