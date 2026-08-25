// scripts/migrate-data.js - Automated Migration & Seeding Script with Fallback Hashing
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
try { require('dotenv').config(); } catch(e){}

const db = require('../server/config/db');
const store = require('../server/services/store');

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch(e){}

function hashPassword(password) {
  if (!password) return '';
  if (bcrypt) return bcrypt.hashSync(password.trim(), 10);
  const salt = 'outlanders_salt_2026';
  return 'pbkdf2:' + crypto.pbkdf2Sync(password.trim(), salt, 1000, 32, 'sha256').toString('hex');
}

async function runMigration() {
  console.log('🚀 Starting Data Migration & Seeding...');

  // 1. Initial Data Load from JSON
  const treksPath = path.join(__dirname, '../data/treks.json');
  const tripsPath = path.join(__dirname, '../data/trips.json');

  let treks = [];
  let trips = [];

  if (fs.existsSync(treksPath)) {
    treks = JSON.parse(fs.readFileSync(treksPath, 'utf8'));
    console.log(`📦 Loaded ${treks.length} treks from treks.json`);
  }

  if (fs.existsSync(tripsPath)) {
    trips = JSON.parse(fs.readFileSync(tripsPath, 'utf8'));
    console.log(`📦 Loaded ${trips.length} trips from trips.json`);
  }

  // 2. Local Store Sync
  const localStore = store.readLocalStore();
  localStore.treks = treks;
  localStore.trips = trips;
  localStore.settings = localStore.settings || store.DEFAULT_SETTINGS;
  localStore.categories = localStore.categories || store.DEFAULT_CATEGORIES;
  localStore.homepage = localStore.homepage || store.DEFAULT_HOMEPAGE;
  localStore.memories = localStore.memories || store.DEFAULT_MEMORIES;

  store.writeLocalStore(localStore);
  console.log('✅ Synchronized data/store.json successfully.');

  // 3. PostgreSQL Database Schema Execution & Table Seeding (if DATABASE_URL is configured)
  const pool = db.getPool();
  if (pool) {
    try {
      console.log('🐘 Executing PostgreSQL / Supabase Schema...');
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await pool.query(schemaSql);
      console.log('✅ Schema tables created/verified.');

      // Seed Initial Admin User
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'outlanders2026';
      const hash = hashPassword(adminPassword);

      await pool.query(`
        INSERT INTO admin_users (id, username, password_hash)
        VALUES ('admin-1', $1, $2)
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      `, [adminUsername, hash]);
      console.log(`🔑 Seeded admin user: ${adminUsername}`);

      // Seed Treks
      for (const t of treks) {
        await store.saveTrek(t);
      }
      console.log(`✅ Seeded ${treks.length} treks into PostgreSQL.`);

      // Seed Trips
      for (const tr of trips) {
        await store.saveTrip(tr);
      }
      console.log(`✅ Seeded ${trips.length} trips into PostgreSQL.`);

      // Seed Categories & Memories
      await store.saveCategories(localStore.categories);
      await store.saveMemories(localStore.memories);

      // Seed Content
      await store.saveContent('settings', localStore.settings);
      await store.saveContent('homepage', localStore.homepage);
      console.log('✅ Database migration completed successfully.');
    } catch (err) {
      console.error('❌ PostgreSQL Migration Error:', err.message);
    }
  } else {
    console.log('ℹ️ DATABASE_URL not active. File-backed data store is ready to serve queries.');
  }

  console.log('🎉 Migration Completed Successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
