// scripts/test-phase8-frontend.js - Automated Test for Phase 8 Frontend Full Data Integration
const http = require('http');

function api(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
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
    req.end();
  });
}

async function testPhase8Frontend() {
  console.log('🌐 Starting Phase 8 Frontend Full Data Integration Verification Test...\n');

  // Step 1: Health Check
  const healthRes = await api('GET', '/health');
  if (healthRes.status !== 200) throw new Error('Health check failed!');
  console.log('✅ Step 1: Backend server health check OK (200).');

  // Step 2: Homepage API
  const hpRes = await api('GET', '/homepage');
  if (hpRes.status !== 200 || !hpRes.data.hero) throw new Error('Homepage API failed!');
  console.log(`✅ Step 2: Homepage API returns live content (Hero Title: "${hpRes.data.hero.title}").`);

  // Step 3: Treks API
  const treksRes = await api('GET', '/treks');
  if (treksRes.status !== 200 || !Array.isArray(treksRes.data)) throw new Error('Treks API failed!');
  const publicTreks = treksRes.data.filter(t => t.published !== false);
  console.log(`✅ Step 3: Treks API returns live treks (${publicTreks.length} published out of ${treksRes.data.length} total).`);

  // Step 4: Trips API
  const tripsRes = await api('GET', '/trips');
  if (tripsRes.status !== 200 || !Array.isArray(tripsRes.data)) throw new Error('Trips API failed!');
  const publicTrips = tripsRes.data.filter(t => t.published !== false);
  console.log(`✅ Step 4: Trips API returns live trips (${publicTrips.length} published out of ${tripsRes.data.length} total).`);

  // Step 5: Categories API
  const catRes = await api('GET', '/categories');
  if (catRes.status !== 200 || !Array.isArray(catRes.data)) throw new Error('Categories API failed!');
  console.log(`✅ Step 5: Categories API returns live categories (${catRes.data.length} categories).`);

  // Step 6: Memories API
  const memRes = await api('GET', '/memories');
  if (memRes.status !== 200 || !Array.isArray(memRes.data)) throw new Error('Memories API failed!');
  console.log(`✅ Step 6: Memories API returns live gallery photos (${memRes.data.length} memories).`);

  // Step 7: Settings API
  const setRes = await api('GET', '/settings');
  if (setRes.status !== 200 || !setRes.data.whatsapp) throw new Error('Settings API failed!');
  console.log(`✅ Step 7: Site Settings API returns WhatsApp number (${setRes.data.whatsapp}).`);

  console.log('\n🎉 ALL PHASE 8 FRONTEND FULL DATA INTEGRATION TESTS PASSED 100% PERFECTLY!');
}

testPhase8Frontend().catch(err => {
  console.error('❌ Phase 8 Test Failed:', err);
  process.exit(1);
});
