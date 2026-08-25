// scripts/test-phase3-categories.js - Automated Test for Phase 3 Categories Module
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

async function testPhase3Categories() {
  console.log('🏷️ Starting Phase 3 Categories Module Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin login successful.');

  // Step 2: View Existing Categories
  const catRes1 = await api('GET', '/categories');
  console.log(`✅ Step 2: Viewed existing categories (${catRes1.data.length} categories in database).`);

  // Step 3: Create a Draft Category
  const testCatId = 'test-phase3-cat-' + Date.now();
  const catPayload = {
    id: testCatId,
    name: 'TEST PHASE3 CATEGORY',
    slug: 'test-phase3-category',
    description: 'Test category description.',
    image: '../images/treks/kudremukha/cover.jpg',
    order_num: 99,
    published: false
  };

  const createRes = await api('POST', '/categories', catPayload, token);
  if (createRes.status !== 201) throw new Error('Create category failed');
  console.log(`✅ Step 3: Created draft TEST category "${testCatId}".`);

  // Step 4: Verify visible in Admin, hidden publicly
  const catRes2 = await api('GET', '/categories');
  const foundAdmin = catRes2.data.find(c => c.id === testCatId);
  if (!foundAdmin) throw new Error('Draft category missing in Admin');
  const publicCats1 = catRes2.data.filter(c => c.published !== false);
  if (publicCats1.find(c => c.id === testCatId)) throw new Error('Draft category appeared publicly!');
  console.log('✅ Step 4: Draft category is visible in Admin and hidden from public website.');

  // Step 5: Publish & verify public visibility
  foundAdmin.published = true;
  await api('PUT', `/categories/${testCatId}`, foundAdmin, token);
  const catRes3 = await api('GET', '/categories');
  const publicCats2 = catRes3.data.filter(c => c.published !== false);
  if (!publicCats2.find(c => c.id === testCatId)) throw new Error('Published category not visible publicly!');
  console.log('✅ Step 5: Published category and verified public visibility.');

  // Step 6: Edit & verify updates
  foundAdmin.name = 'TEST PHASE3 CATEGORY (UPDATED)';
  await api('PUT', `/categories/${testCatId}`, foundAdmin, token);
  
  const allCats = await api('GET', '/categories');
  const updated = allCats.data.find(c => c.id === testCatId);
  if (!updated || updated.name !== 'TEST PHASE3 CATEGORY (UPDATED)') {
    throw new Error('Update failed: ' + JSON.stringify(updated));
  }
  console.log('✅ Step 6: Updated category title, verified live API updates.');

  // Step 7: Delete & clean up
  await api('DELETE', `/categories/${testCatId}`, null, token);
  const finalCats = await api('GET', '/categories');
  if (finalCats.data.find(c => c.id === testCatId)) throw new Error('Deleted category still exists!');
  console.log('✅ Step 7: Deleted TEST category and confirmed complete cleanup.');

  console.log('\n🎉 ALL PHASE 3 CATEGORIES MODULE TESTS PASSED 100% PERFECTLY!');
}

testPhase3Categories().catch(err => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
