// server/config/db.js - PostgreSQL Pool / Supabase Database Connection Layer
try { require('dotenv').config(); } catch(e){}

let Pool = null;
try {
  Pool = require('pg').Pool;
} catch(e) {}

let pool = null;
let isConnected = false;

if (Pool && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL Pool Error:', err);
    });

    pool.query('SELECT 1')
      .then(() => {
        isConnected = true;
        console.log('✅ PostgreSQL / Supabase Database connected successfully.');
      })
      .catch((err) => {
        console.warn('⚠️ Could not connect to PostgreSQL DATABASE_URL:', err.message);
        console.warn('ℹ️ Running backend with fallback JSON/memory store until DATABASE_URL is configured.');
      });
  } catch (e) {
    console.warn('⚠️ Pool initialization error:', e.message);
  }
} else {
  console.log('ℹ️ DATABASE_URL not set or pg driver initializing. Running backend with JSON store adapter.');
}

async function query(text, params) {
  if (pool && isConnected) {
    return pool.query(text, params);
  }
  throw new Error('Database pool not connected.');
}

function getPool() {
  return pool;
}

function isDbConnected() {
  return pool !== null && isConnected;
}

module.exports = {
  query,
  getPool,
  isDbConnected
};
