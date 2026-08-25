// scripts/verify-all-tests.js - Automated Test Runner for all 7 User Requirements Tests
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const TREKS_FILE = path.join(__dirname, '../data/treks.json');

function request(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + urlPath,
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

function httpGet(urlStr) {
  return new Promise((resolve) => {
    const req = http.get(urlStr, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', (e) => resolve({ status: 500, body: e.message }));
  });
}

async function runAllTests() {
  console.log('🚀 Running 7-Step User Requirement Verification Tests...\n');

  // Login to get token
  const login = await request('POST', '/auth/login', { username: 'admin', password: 'outlanders2026' });
  const token = login.body.token;

  // --- TEST 1 ---
  console.log('--- TEST 1: Create temporary trek "TEST OUTLANDERS AUTO SAVE" (Price: 2999) ---');
  const trek1 = {
    id: 'test-outlanders-auto-save',
    name: 'TEST OUTLANDERS AUTO SAVE',
    price: 2999,
    category: 'Western Ghats',
    location: 'Chikkamagaluru, Karnataka',
    date: 'Every Friday Departure',
    duration: '2 Days / 1 Night',
    difficulty: 'Moderate',
    published: true
  };
  const createRes = await request('POST', '/treks', trek1, token);
  console.log('API Create Status:', createRes.status);
  
  const treksFileContent1 = fs.readFileSync(TREKS_FILE, 'utf8');
  if (!treksFileContent1.includes('TEST OUTLANDERS AUTO SAVE') || !treksFileContent1.includes('2999')) {
    throw new Error('TEST 1 FAILED: data/treks.json does not contain "TEST OUTLANDERS AUTO SAVE"');
  }
  console.log('✅ TEST 1 PASSED: data/treks.json contains new trek record with price 2999.\n');

  // --- TEST 2 ---
  console.log('--- TEST 2: Run git status to verify data/treks.json is detected as modified ---');
  const gitStatusOutput = execSync('git status', { cwd: path.join(__dirname, '..') }).toString();
  console.log('git status output snippet:\n' + gitStatusOutput);
  if (!gitStatusOutput.includes('data/treks.json')) {
    throw new Error('TEST 2 FAILED: git status did not detect modified data/treks.json');
  }
  console.log('✅ TEST 2 PASSED: git status correctly registered modified: data/treks.json.\n');

  // --- TEST 3 ---
  console.log('--- TEST 3: Edit price of temporary trek to 3499 ---');
  const updateRes = await request('PUT', '/treks/test-outlanders-auto-save', { price: 3499 }, token);
  console.log('API Update Status:', updateRes.status);

  const treksFileContent3 = fs.readFileSync(TREKS_FILE, 'utf8');
  if (!treksFileContent3.includes('3499')) {
    throw new Error('TEST 3 FAILED: data/treks.json does not contain updated price 3499');
  }
  console.log('✅ TEST 3 PASSED: data/treks.json updated with price 3499.\n');

  // --- TEST 4 ---
  console.log('--- TEST 4: Delete temporary trek ---');
  const deleteRes = await request('DELETE', '/treks/test-outlanders-auto-save', null, token);
  console.log('API Delete Status:', deleteRes.status);

  const treksFileContent4 = fs.readFileSync(TREKS_FILE, 'utf8');
  if (treksFileContent4.includes('test-outlanders-auto-save')) {
    throw new Error('TEST 4 FAILED: temporary trek was not removed from data/treks.json');
  }
  console.log('✅ TEST 4 PASSED: temporary trek removed from data/treks.json.\n');

  // --- TEST 5 ---
  console.log('--- TEST 5: Run existing acceptance test scripts ---');
  execSync('node scripts/test-acceptance.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  execSync('node scripts/test-itinerary.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ TEST 5 PASSED: Existing acceptance test suites passed 100%.\n');

  // --- TEST 6 ---
  console.log('--- TEST 6: Verify public frontend loads ---');
  const fe5000 = await httpGet('http://localhost:5000/frontend/index.html');
  if (fe5000.status !== 200) {
    throw new Error(`TEST 6 FAILED: Frontend HTTP status 5000=${fe5000.status}`);
  }
  console.log('✅ TEST 6 PASSED: Frontend loads cleanly.\n');

  // --- TEST 7 ---
  console.log('--- TEST 7: Verify http://localhost:5000/data/treks.json returns valid JSON ---');
  const data5000 = await httpGet('http://localhost:5000/data/treks.json');
  if (data5000.status !== 200) {
    throw new Error(`TEST 7 FAILED: data/treks.json status 5000=${data5000.status}`);
  }
  const parsedData = JSON.parse(data5000.body);
  if (!Array.isArray(parsedData)) {
    throw new Error('TEST 7 FAILED: data/treks.json is not a valid JSON array');
  }
  console.log(`✅ TEST 7 PASSED: http://localhost:5000/data/treks.json returns valid JSON array with ${parsedData.length} trek records.\n`);

  console.log('🎉 ALL 7 USER REQUIREMENT TESTS PASSED 100% PERFECTLY!');
}

runAllTests().catch(err => {
  console.error('❌ Verification Test Failed:', err);
  process.exit(1);
});
