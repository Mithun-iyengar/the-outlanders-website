// server/config/db.js - PostgreSQL Pool / Supabase Database Connection Layer
try { require('dotenv').config(); } catch(e){}

let Pool = null;
try {
  Pool = require('pg').Pool;
} catch(e) {}

let pool = null;
let isConnected = false;

function getValidDbUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.POSTGRES_URL
  ];
  for (let cand of candidates) {
    if (!cand || typeof cand !== 'string') continue;
    const cleaned = cand.trim().replace(/^["']|["']$/g, '');
    if (cleaned.length > 10 && !cleaned.includes('@base/') && !cleaned.includes('@base:') && !cleaned.includes('://base') && (cleaned.includes('postgresql://') || cleaned.includes('postgres://'))) {
      return cleaned;
    }
  }
  return '';
}

const dbUrl = getValidDbUrl();

if (Pool && dbUrl) {
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : (dbUrl.includes('supabase') ? { rejectUnauthorized: false } : false),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL Pool Error:', err);
    });

    // Initial ping connection test
    pool.query('SELECT 1')
      .then(() => {
        isConnected = true;
        console.log('✅ PostgreSQL / Supabase Database connected successfully.');
      })
      .catch((err) => {
        console.warn('⚠️ Could not connect to PostgreSQL database:', err.message);
        isConnected = false;
      });
  } catch (e) {
    console.warn('⚠️ Pool initialization error:', e.message);
  }
} else {
  console.log('ℹ️ DATABASE_URL not set or pg driver unavailable.');
}

async function query(text, params) {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      isConnected = true;
      return res;
    } catch (err) {
      if (err.message && (err.message.includes('Connection terminated') || err.message.includes('closed') || err.message.includes('ENOTFOUND'))) {
        isConnected = false;
      }
      throw err;
    }
  }
  throw new Error('Database pool not initialized or DATABASE_URL invalid.');
}

function getPool() {
  return pool;
}

function isDbConnected() {
  return pool !== null;
}

module.exports = {
  query,
  getPool,
  isDbConnected
};
