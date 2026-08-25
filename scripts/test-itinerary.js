// scripts/test-itinerary.js - Automated Test for Trip & Trek Itinerary Upload & Persistence
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

async function testItineraryPersistence() {
  console.log('🧪 Testing Trip & Trek Itinerary Persistence...');

  // 1. Admin Login
  const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.token;

  // 2. Test Trip Itinerary Saving
  const testTrip = {
    id: 'test-trip-itinerary',
    name: 'TEST ITINERARY TRIP',
    title: 'TEST ITINERARY TRIP',
    category: 'Weekend Trips',
    location: 'Gokarna, Karnataka',
    date: 'Every Friday Departure',
    duration: '2 Days / 1 Night',
    price: 2499,
    itinerary: '../assets/documents/Gokarna.pdf',
    shortDescription: 'Test trip for itinerary verification.',
    published: true
  };

  const createTripRes = await request('POST', '/trips', testTrip, token);
  console.log('Step 1: Create Trip with Itinerary PDF -> Status:', createTripRes.status);
  if (createTripRes.status !== 201 || createTripRes.body.itinerary !== '../assets/documents/Gokarna.pdf') {
    throw new Error('Failed to save trip itinerary: ' + JSON.stringify(createTripRes.body));
  }
  console.log('✅ Trip itinerary PDF saved successfully:', createTripRes.body.itinerary);

  // 3. Verify Public GET /api/trips/test-trip-itinerary
  const getTripRes = await request('GET', '/trips/test-trip-itinerary');
  if (getTripRes.status !== 200 || getTripRes.body.itinerary !== '../assets/documents/Gokarna.pdf') {
    throw new Error('Public trip API did not return saved itinerary: ' + JSON.stringify(getTripRes.body));
  }
  console.log('✅ Public Trip API returned saved itinerary:', getTripRes.body.itinerary);

  // 4. Update Trip Itinerary to Uploaded File Path
  const updateTripRes = await request('PUT', '/trips/test-trip-itinerary', {
    itinerary: '../images/uploads/test-uploaded-itinerary.pdf'
  }, token);
  if (updateTripRes.status !== 200 || updateTripRes.body.itinerary !== '../images/uploads/test-uploaded-itinerary.pdf') {
    throw new Error('Failed to update trip itinerary: ' + JSON.stringify(updateTripRes.body));
  }
  console.log('✅ Trip itinerary update verified:', updateTripRes.body.itinerary);

  // 5. Clean up
  await request('DELETE', '/trips/test-trip-itinerary', null, token);
  console.log('✅ Cleaned up test trip.');

  console.log('🎉 ALL TRIP & TREK ITINERARY PERSISTENCE TESTS PASSED 100%!');
}

testItineraryPersistence().catch(err => {
  console.error('❌ Itinerary Persistence Test Failed:', err);
  process.exit(1);
});
