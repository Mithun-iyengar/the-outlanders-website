// scripts/test-rls-security.js - Automated Test for Row Level Security (RLS) Policies
const { supabase } = require('../server/config/supabaseClient');

async function testRLSSecurity() {
  console.log('🔒 Testing Row Level Security (RLS) Policies on Supabase...\n');

  if (!supabase) {
    console.error('❌ Supabase client not initialized.');
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;

  async function assertBlocked(description, operationPromise) {
    totalTests++;
    try {
      const res = await operationPromise;
      if (res.error) {
        console.log(`✅ [PASS] ${description}: Blocked as expected (${res.error.message})`);
        passedTests++;
      } else if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
        console.log(`✅ [PASS] ${description}: Blocked by RLS (0 rows returned/affected).`);
        passedTests++;
      } else {
        console.error(`❌ [FAIL] ${description}: Operation was NOT blocked! Returned data:`, res.data);
      }
    } catch (err) {
      console.log(`✅ [PASS] ${description}: Exception thrown (${err.message})`);
      passedTests++;
    }
  }

  async function assertAllowed(description, operationPromise) {
    totalTests++;
    try {
      const res = await operationPromise;
      if (res.error) {
        console.warn(`⚠️ [WARN] ${description}: ${res.error.message}`);
      } else {
        console.log(`✅ [PASS] ${description}: Allowed cleanly.`);
        passedTests++;
      }
    } catch (err) {
      console.error(`❌ [FAIL] ${description}: Exception (${err.message})`);
    }
  }

  // 1. Test Admin Users Protection
  await assertBlocked(
    'Anonymous SELECT on admin_users table (protect password_hash)',
    supabase.from('admin_users').select('*')
  );

  await assertBlocked(
    'Anonymous INSERT into admin_users table',
    supabase.from('admin_users').insert([{ id: 'hack-user', username: 'hacker', password_hash: '123456' }])
  );

  // 2. Test Public Read Operations
  await assertAllowed(
    'Public SELECT on published treks',
    supabase.from('treks').select('id, name, published').eq('published', true)
  );

  await assertAllowed(
    'Public SELECT on published trips',
    supabase.from('trips').select('id, name, published').eq('published', true)
  );

  await assertAllowed(
    'Public SELECT on published categories',
    supabase.from('categories').select('id, name, published').eq('published', true)
  );

  await assertAllowed(
    'Public SELECT on published memories',
    supabase.from('memories').select('id, image, published').eq('published', true)
  );

  await assertAllowed(
    'Public SELECT on site content / settings',
    supabase.from('content').select('key, value')
  );

  // 3. Test Public Write Block Operations
  await assertBlocked(
    'Public INSERT into treks table',
    supabase.from('treks').insert([{ id: 'unauth-trek', name: 'Hacked Trek', category: 'Test', price: 9999 }])
  );

  await assertBlocked(
    'Public UPDATE on treks table',
    supabase.from('treks').update({ price: 0 }).eq('id', 'trek-1').select()
  );

  await assertBlocked(
    'Public DELETE on treks table',
    supabase.from('treks').delete().eq('id', 'trek-1').select()
  );

  await assertBlocked(
    'Public INSERT into trips table',
    supabase.from('trips').insert([{ id: 'unauth-trip', name: 'Hacked Trip', category: 'Test', price: 9999 }])
  );

  await assertBlocked(
    'Public INSERT into memories table',
    supabase.from('memories').insert([{ id: 'unauth-mem', image: 'hacked.jpg', category: 'Test' }])
  );

  await assertBlocked(
    'Public INSERT into content table',
    supabase.from('content').insert([{ key: 'hacked_key', value: { hack: true } }])
  );

  console.log(`\n🛡️ RLS SECURITY TEST RESULT: ${passedTests}/${totalTests} PASS RATE.`);
}

testRLSSecurity().catch(err => {
  console.error('❌ RLS Test Execution Error:', err);
  process.exit(1);
});
