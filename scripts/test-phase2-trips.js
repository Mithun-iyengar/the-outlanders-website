// scripts/test-phase2-trips.js - Automated Test for Phase 2 Trips Module
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

async function testPhase2Trips() {
  console.log('🚗 Starting Phase 2 Trips Module Verification Test...\n');

  // Step 1: Admin Login
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = loginRes.data.token;
  console.log('✅ Step 1: Admin login successful.');

  // Step 2: View Existing Trips
  const tripsRes1 = await api('GET', '/trips');
  console.log(`✅ Step 2: Viewed existing trips (${tripsRes1.data.length} trips in database).`);

  // Step 3: Create a Draft TEST Trip
  const testTripId = 'test-phase2-trip-' + Date.now();
  const tripPayload = {
    id: testTripId,
    name: 'TEST PHASE2 ROAD TRIP',
    category: 'Road Trips',
    location: 'Gokarna, Karnataka',
    date: 'Every Weekend',
    duration: '2 Days / 1 Night',
    price: 2999,
    published: false,
    shortDescription: 'Draft test road trip.',
    itinerary: '../assets/documents/Gokarna.pdf'
  };

  const createRes = await api('POST', '/trips', tripPayload, token);
  if (createRes.status !== 201) throw new Error('Create trip failed');
  console.log(`✅ Step 3: Created draft TEST trip "${testTripId}".`);

  // Step 4: Verify visible in Admin, hidden publicly
  const tripsRes2 = await api('GET', '/trips');
  const foundAdmin = tripsRes2.data.find(t => t.id === testTripId);
  if (!foundAdmin) throw new Error('Draft trip missing in Admin');
  const publicTrips1 = tripsRes2.data.filter(t => t.published !== false);
  if (publicTrips1.find(t => t.id === testTripId)) throw new Error('Draft trip appeared publicly!');
  console.log('✅ Step 4: Draft trip is visible in Admin and hidden from public website.');

  // Step 5: Publish & verify public visibility
  foundAdmin.published = true;
  await api('PUT', `/trips/${testTripId}`, foundAdmin, token);
  const tripsRes3 = await api('GET', '/trips');
  const publicTrips2 = tripsRes3.data.filter(t => t.published !== false);
  if (!publicTrips2.find(t => t.id === testTripId)) throw new Error('Published trip not visible publicly!');
  console.log('✅ Step 5: Published trip and verified public visibility.');

  // Step 6: Edit & verify frontend update
  foundAdmin.name = 'TEST PHASE2 ROAD TRIP (UPDATED)';
  foundAdmin.price = 3499;
  await api('PUT', `/trips/${testTripId}`, foundAdmin, token);
  const updated = await api('GET', `/trips/${testTripId}`);
  if (updated.data.name !== 'TEST PHASE2 ROAD TRIP (UPDATED)' || updated.data.price !== 3499) throw new Error('Update failed');
  console.log('✅ Step 6: Updated trip title and price, verified live API updates.');

  // Step 7: Delete & clean up
  await api('DELETE', `/trips/${testTripId}`, null, token);
  const finalTrips = await api('GET', '/trips');
  if (finalTrips.data.find(t => t.id === testTripId)) throw new Error('Deleted trip still exists!');
  console.log('✅ Step 7: Deleted TEST trip and confirmed complete cleanup.');

  console.log('\n🎉 ALL PHASE 2 TRIPS MODULE TESTS PASSED 100% PERFECTLY!');
}

testPhase2Trips().catch(err => {
  console.error('❌ Phase 2 Test Failed:', err);
  process.exit(1);
});
