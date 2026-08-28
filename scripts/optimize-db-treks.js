// scripts/optimize-db-treks.js - Clean up base64 images in data/treks.json & PostgreSQL DB
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const treksFilePath = path.join(__dirname, '../data/treks.json');

function cleanTreksData() {
  console.log('🧹 Cleaning data/treks.json base64 image entries...');
  const raw = fs.readFileSync(treksFilePath, 'utf8');
  const treks = JSON.parse(raw);

  treks.forEach(t => {
    if (t.id === 'kudremukha' || (t.name && t.name.toLowerCase().includes('kudremukha'))) {
      if (t.image && t.image.startsWith('data:')) {
        t.image = '../images/treks/kudremukha/cover.jpg';
      }
      if (t.coverImage && t.coverImage.startsWith('data:')) {
        t.coverImage = '../images/treks/kudremukha/cover.jpg';
      }
    }
    if (t.id === 'netravathi' || (t.name && t.name.toLowerCase().includes('netravathi'))) {
      if (t.image && t.image.startsWith('data:')) {
        t.image = '../images/treks/netravathi/cover.jpg';
      }
      if (t.coverImage && t.coverImage.startsWith('data:')) {
        t.coverImage = '../images/treks/netravathi/cover.jpg';
      }
    }
    if (t.id === 'kurinjal' || (t.name && t.name.toLowerCase().includes('kurinjal'))) {
      if (t.image && t.image.startsWith('data:')) {
        t.image = '../images/treks/kurinjal/cover.jpg';
      }
      if (t.coverImage && t.coverImage.startsWith('data:')) {
        t.coverImage = '../images/treks/kurinjal/cover.jpg';
      }
    }
    if (t.id === 'bandaje-arbi' || (t.name && t.name.toLowerCase().includes('bandaje'))) {
      if (t.image && t.image.startsWith('data:')) {
        t.image = '../images/treks/bandaje/cover.jpg';
      }
      if (t.coverImage && t.coverImage.startsWith('data:')) {
        t.coverImage = '../images/treks/bandaje/cover.jpg';
      }
    }
  });

  fs.writeFileSync(treksFilePath, JSON.stringify(treks, null, 2), 'utf8');
  console.log(`✅ data/treks.json successfully updated! (File size: ${(fs.statSync(treksFilePath).size / 1024).toFixed(2)} KB)`);
}

async function syncToDatabase() {
  try {
    const db = require('../server/config/db');
    if (!db.isDbConnected()) {
      console.log('ℹ️ Database connection not active, skipped DB update.');
      return;
    }
    console.log('🔄 Syncing cleaned data/treks.json to PostgreSQL database...');
    const treks = JSON.parse(fs.readFileSync(treksFilePath, 'utf8'));
    for (let t of treks) {
      await db.query(
        `UPDATE treks SET image = $1, cover_image = $2, updated_at = NOW() WHERE id = $3 OR slug = $3`,
        [t.image, t.coverImage, t.id]
      );
    }
    console.log('✅ PostgreSQL DB treks table updated cleanly!');
  } catch(e) {
    console.warn('⚠️ DB sync warning:', e.message);
  }
}

cleanTreksData();
syncToDatabase().then(() => {
  console.log('🎉 Data cleanup complete!');
  process.exit(0);
});
