// server/config/supabaseClient.js - Reusable Supabase Client for The Outlanders
const { createClient } = require('@supabase/supabase-js');
try { require('dotenv').config(); } catch(e){}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcwnzaeydvosuiclddqr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    console.log(`⚡ Supabase client initialized for URL: ${SUPABASE_URL}`);
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ Supabase Publishable Key not set in environment. Set SUPABASE_PUBLISHABLE_KEY in .env.');
}

async function testConnection() {
  if (!supabase) {
    return { success: false, connected: false, message: 'Supabase client not initialized (missing SUPABASE_PUBLISHABLE_KEY).' };
  }
  try {
    const { data, error } = await supabase.from('treks').select('id, name').limit(1);
    if (error) {
      return { success: false, connected: false, error: error.message };
    }
    return { success: true, connected: true, count: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    return { success: false, connected: false, error: err.message };
  }
}

module.exports = {
  supabase,
  SUPABASE_URL,
  testConnection
};
