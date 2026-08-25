// scripts/test-supabase-connection.js - Test Supabase Client Connection
const https = require('https');
const { testConnection, SUPABASE_URL } = require('../server/config/supabaseClient');

function testDirectHTTPS() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'qcwnzaeydvosuiclddqr.supabase.co',
      port: 443,
      path: '/rest/v1/treks?select=id,name',
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_OgXymBA4gWFDUOuykSgvCA_6SRbPjSL',
        'Authorization': 'Bearer sb_publishable_OgXymBA4gWFDUOuykSgvCA_6SRbPjSL'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.end();
  });
}

async function run() {
  console.log(`⚡ Testing connection to Supabase Project: ${SUPABASE_URL}`);
  
  const directResult = await testDirectHTTPS();
  console.log('📡 Direct HTTPS REST Test Status:', directResult.status);
  
  if (directResult.status === 200) {
    console.log('✅ DIRECT CONNECTION SUCCESSFUL! Supabase responded with HTTP 200 OK.');
    console.log('Data sample:', directResult.body);
  } else {
    console.log('⚠️ Direct Connection Status:', directResult);
  }

  const jsClientResult = await testConnection();
  console.log('📦 JS Client Test Result:', jsClientResult);
}

run();
