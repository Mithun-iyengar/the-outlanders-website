// scripts/test-supabase-connection.js - Test Supabase Client Connection
const { testConnection, SUPABASE_URL } = require('../server/config/supabaseClient');

async function run() {
  console.log(`🔗 Testing connection to Supabase Project: ${SUPABASE_URL}`);
  const result = await testConnection();
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.connected) {
    console.log('✅ Connected successfully to Supabase!');
  } else {
    console.log('ℹ️ Status:', result.message || result.error || 'Connection pending publishable key.');
  }
}

run();
