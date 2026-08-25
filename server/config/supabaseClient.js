// server/config/supabaseClient.js - Reusable Supabase Client for The Outlanders
const { createClient } = require('@supabase/supabase-js');
try { require('dotenv').config(); } catch(e){}

// Allow local Windows Node.js dev environment SSL certificate verification
if (process.env.NODE_ENV !== 'production' && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcwnzaeydvosuiclddqr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_OgXymBA4gWFDUOuykSgvCA_6SRbPjSL';

let supabase = null;

if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false }
    });
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
    return { success: true, connected: true, data, count: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    return { success: false, connected: false, error: err.message };
  }
}

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  testConnection
};
