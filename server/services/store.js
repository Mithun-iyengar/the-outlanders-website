// server/services/store.js - Unified Data Access Layer (PostgreSQL + Local File Storage Backup)
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const TREKS_FILE = path.join(DATA_DIR, 'treks.json');
const TRIPS_FILE = path.join(DATA_DIR, 'trips.json');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch(e) {}


const DEFAULT_SETTINGS = {
  name: "The Outlanders",
  logo: "../images/logo/outlanders-logo.png",
  whatsapp: "917795167667",
  phone: "+91 77951 67667",
  instagram: "https://www.instagram.com/trek_with_theoutlanders/",
  communityUrl: "https://chat.whatsapp.com/GsFyASKtUKoGlFV2lVsAyM",
  copyright: "© 2026 The Outlanders. All Rights Reserved.",
  seoTitle: "THE OUTLANDERS — Explore Beyond The Ordinary",
  seoDescription: "Discover handcrafted treks across the Western Ghats with local support, safety, and a vibrant community of adventurers."
};

const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "Western Ghats", slug: "Western Ghats", description: "Lush mountain trails across Karnataka and Kerala", image: "../images/treks/kudremukha/cover.jpg", order: 1, published: true },
  { id: "cat-2", name: "Weekend Trips", slug: "Weekend", description: "Quick 2-day escapes away from the city", image: "../images/trips/roadtrip-card.jpg", order: 2, published: true },
  { id: "cat-3", name: "Camping", slug: "Camping", description: "Wilderness camping and starlight outdoor stays", image: "../images/intro/intro.jpg", order: 3, published: true },
  { id: "cat-4", name: "Road Trips", slug: "Road Trips", description: "Scenic mountain drives and coastal loops", image: "../images/trips/roadtrip-card.jpg", order: 4, published: true },
  { id: "cat-5", name: "Adventure Experiences", slug: "Adventure", description: "High thrill outdoor experiences and river trails", image: "../images/intro/intro.jpg", order: 5, published: true }
];

const DEFAULT_HOMEPAGE = {
  hero: {
    eyebrow: "UNFORGETTABLE ADVENTURES",
    title: "EXPLORE BEYOND THE ORDINARY",
    sub: "Discover breathtaking trails, hidden destinations, unforgettable journeys, and the wild beauty of the Western Ghats with The Outlanders.",
    btn1Text: "EXPLORE TREKS",
    btn1Link: "treks.html",
    btn2Text: "UPCOMING TRIPS",
    btn2Link: "trips.html",
    bgImage: "../images/hero/scroll-back.jpg"
  },
  intro: {
    eyebrow: "OUR PHILOSOPHY",
    title: "NOT JUST A TRIP. A STORY TO REMEMBER.",
    lead: "The Outlanders brings together people who love mountains, trails, nature, adventure, and unforgettable experiences.",
    desc: "We design handcrafted treks across the Western Ghats with careful planning, local support, safety guidelines, and a genuine spirit of camaraderie.",
    btnText: "Learn More About Us",
    btnLink: "about.html",
    image: "../images/intro/intro.jpg"
  },
  discover: {
    eyebrow: "FIND YOUR KIND OF WILD",
    title: "DISCOVER BY EXPERIENCE",
    sub: "Explore the Western Ghats through trails, road journeys, and unforgettable outdoor experiences.",
    cards: [
      { id: "card-1", title: "WESTERN GHATS TREKS", action: "EXPLORE TRAILS ↗", image: "../images/treks/kudremukha/cover.jpg", link: "treks.html?category=Western%20Ghats", order: 1, published: true },
      { id: "card-2", title: "ROAD TRIPS", action: "HIT THE ROAD ↗", image: "../images/trips/roadtrip-card.jpg", link: "trips.html", order: 2, published: true },
      { id: "card-3", title: "ADVENTURE EXPERIENCES", action: "LIVE THE ADVENTURE ↗", image: "../images/intro/intro.jpg", link: "treks.html", order: 3, published: true }
    ]
  },
  whyTrek: {
    eyebrow: "THE OUTLANDERS DIFFERENCE",
    title: "WHY TREK WITH US",
    features: [
      { id: "f-1", icon: "bi-map", title: "Curated Adventures", desc: "Carefully planned experiences and handpicked trails crafted for true nature lovers.", order: 1, published: true },
      { id: "f-2", icon: "bi-people", title: "Like-Minded Community", desc: "Meet fellow enthusiasts who share your passion for travel, mountains, and outdoors.", order: 2, published: true },
      { id: "f-3", icon: "bi-camera", title: "Memories Beyond Peaks", desc: "Every trip is crafted to leave you with stories, friendships, and lifelong memories.", order: 3, published: true },
      { id: "f-4", icon: "bi-shield-check", title: "Safe & Organized", desc: "Experienced leads, safety protocols, local support, and structured coordination.", order: 4, published: true }
    ]
  },
  community: {
    eyebrow: "CONNECT WITH US",
    title: "JOIN THE OUTLANDERS",
    desc: "Stay connected with fellow adventurers, discover upcoming treks, and get the latest updates from The Outlanders community.",
    btnText: "JOIN OUR WHATSAPP COMMUNITY"
  },
  finalCta: {
    title: "YOUR NEXT ADVENTURE IS WAITING.",
    desc: "Step out of your comfort zone and into the wild.",
    btnText: "EXPLORE UPCOMING TREKS",
    btnLink: "treks.html",
    bgImage: "../images/hero/scroll-back.jpg"
  }
};

const DEFAULT_MEMORIES = [
  { id: "mem-1", image: "../images/treks/kudremukha/cover.jpg", category: "Western Ghats", order: 1, created_at: 1770000000000, published: true },
  { id: "mem-2", image: "../images/hero/scroll-back.jpg", category: "Highland Trails", order: 2, created_at: 1770000100000, published: true },
  { id: "mem-3", image: "../images/trips/roadtrip-card.jpg", category: "Road Trips", order: 3, created_at: 1770000200000, published: true },
  { id: "mem-4", image: "../images/intro/intro.jpg", category: "Camping", order: 4, created_at: 1770000300000, published: true },
  { id: "mem-5", image: "../images/trips/gokarna/cover.jpg", category: "Weekend Getaways", order: 5, created_at: 1770000400000, published: true },
  { id: "mem-6", image: "../images/trips/camping/cover.jpg", category: "Camping", order: 6, created_at: 1770000500000, published: true },
  { id: "mem-7", image: "../images/trips/roadtrip/cover.jpg", category: "Road Trips", order: 7, created_at: 1770000600000, published: true },
  { id: "mem-8", image: "../images/treks/netravathi/cover.jpg", category: "Western Ghats", order: 8, created_at: 1770000700000, published: true }
];

function readLocalStore() {
  let store = {
    settings: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    homepage: DEFAULT_HOMEPAGE,
    memories: DEFAULT_MEMORIES,
    treks: [],
    trips: [],
    media: []
  };

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed) store = Object.assign(store, parsed);
    }

    if (fs.existsSync(TREKS_FILE)) {
      const rawTreks = fs.readFileSync(TREKS_FILE, 'utf8');
      store.treks = JSON.parse(rawTreks);
    }

    if (fs.existsSync(TRIPS_FILE)) {
      const rawTrips = fs.readFileSync(TRIPS_FILE, 'utf8');
      store.trips = JSON.parse(rawTrips);
    }

    if (fs.existsSync(MEMORIES_FILE)) {
      const rawMemories = fs.readFileSync(MEMORIES_FILE, 'utf8');
      store.memories = JSON.parse(rawMemories);
    }
  } catch (e) {
    console.error('Error reading local store:', e);
  }

  return store;
}

function safeWriteJsonSync(filePath, data) {
  const tmpPath = `${filePath}.${Date.now()}-${Math.random().toString(36).substring(2, 8)}.tmp`;
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    console.warn(`Local file store write skipped (${e.code || e.message}) - Read-only cloud environment.`);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
    }
  }
}

function writeLocalStore(store) {
  try {
    safeWriteJsonSync(STORE_FILE, store);
    if (store.treks) safeWriteJsonSync(TREKS_FILE, store.treks);
    if (store.trips) safeWriteJsonSync(TRIPS_FILE, store.trips);
    if (store.memories) safeWriteJsonSync(MEMORIES_FILE, store.memories);
  } catch (e) {
    console.error('Error writing local store:', e);
  }
}

// === TREKS API ===
async function getTreks() {
  const defaultTreks = readLocalStore().treks || [];
  if (db.isDbConnected()) {
    try {
      // Clean up test rows and trigger catalog upserts asynchronously in background
      db.query("DELETE FROM treks WHERE id LIKE 'unauth%' OR id LIKE 'e2e%'").catch(() => {});
      
      const res = await db.query('SELECT * FROM treks WHERE id NOT LIKE \'unauth%\' AND id NOT LIKE \'e2e%\' ORDER BY created_at DESC');
      
      // If DB lacks catalog treks, trigger background seed without delaying GET response
      if (!res.rows || res.rows.length < defaultTreks.length) {
        Promise.all(defaultTreks.map(t => saveTrek(t).catch(() => {}))).catch(() => {});
      }

      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug || row.id,
          category: row.category,
          location: row.location,
          date: row.date,
          duration: row.duration,
          difficulty: row.difficulty,
          price: parseFloat(row.price),
          image: row.image,
          coverImage: row.cover_image,
          featuredImage: row.featured_image,
          shortDescription: row.short_description,
          description: row.short_description,
          featured: row.featured,
          published: row.published,
          itinerary: row.itinerary,
          inclusions: row.inclusions || ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
          created_at: Number(row.created_at),
          updated_at: Number(row.updated_at)
        }));
      }
    } catch (e) {
      console.warn('DB getTreks error, fallback to file:', e.message);
    }
  }
  return defaultTreks;
}

async function getTrekById(id) {
  const treks = await getTreks();
  return treks.find(t => t.id === id || t.slug === id) || null;
}

async function saveTrek(trekData) {
  const treks = await getTreks();
  const existingIdx = treks.findIndex(t => t.id === trekData.id || t.slug === trekData.id);
  const now = Date.now();
  const existingTrek = existingIdx !== -1 ? treks[existingIdx] : {};

  const trekObj = Object.assign({}, existingTrek, trekData, {
    id: trekData.id || existingTrek.id || 'trek-' + now,
    name: trekData.name || existingTrek.name || 'Untitled Trek',
    slug: trekData.slug || trekData.id || existingTrek.slug || ('trek-' + now),
    category: trekData.category || existingTrek.category || 'Western Ghats',
    location: trekData.location || existingTrek.location || '',
    date: trekData.date || existingTrek.date || 'Every Friday Departure',
    duration: trekData.duration || existingTrek.duration || '2 Days',
    difficulty: trekData.difficulty || existingTrek.difficulty || 'Moderate',
    price: Number(trekData.price !== undefined ? trekData.price : (existingTrek.price || 0)),
    image: trekData.image || existingTrek.image || '',
    coverImage: trekData.coverImage || trekData.image || existingTrek.coverImage || '',
    featuredImage: trekData.featuredImage || existingTrek.featuredImage || '',
    shortDescription: trekData.shortDescription || trekData.description || existingTrek.shortDescription || '',
    description: trekData.description || trekData.shortDescription || existingTrek.description || '',
    featured: trekData.featured !== undefined ? Boolean(trekData.featured) : Boolean(existingTrek.featured),
    published: trekData.published !== undefined ? trekData.published !== false : (existingTrek.published !== false),
    itinerary: trekData.itinerary !== undefined ? trekData.itinerary : (existingTrek.itinerary || ''),
    inclusions: trekData.inclusions || existingTrek.inclusions || ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
    created_at: trekData.created_at || existingTrek.created_at || now,
    updated_at: now
  });

  if (db.isDbConnected()) {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS treks (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255),
          category VARCHAR(255),
          location VARCHAR(255),
          date VARCHAR(255),
          duration VARCHAR(255),
          difficulty VARCHAR(255),
          price NUMERIC(10,2) DEFAULT 0,
          image TEXT,
          cover_image TEXT,
          featured_image TEXT,
          short_description TEXT,
          featured BOOLEAN DEFAULT false,
          published BOOLEAN DEFAULT true,
          itinerary TEXT,
          created_at BIGINT,
          updated_at BIGINT
        );
      `);
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS cover_image TEXT;`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS featured_image TEXT;`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS itinerary TEXT;`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS slug VARCHAR(255);`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS difficulty VARCHAR(255);`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS duration VARCHAR(255);`).catch(() => {});
      await db.query(`ALTER TABLE treks ADD COLUMN IF NOT EXISTS short_description TEXT;`).catch(() => {});

      const queryText = `
        INSERT INTO treks (id, name, slug, category, location, date, duration, difficulty, price, image, cover_image, featured_image, short_description, featured, published, itinerary, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          category = EXCLUDED.category,
          location = EXCLUDED.location,
          date = EXCLUDED.date,
          duration = EXCLUDED.duration,
          difficulty = EXCLUDED.difficulty,
          price = EXCLUDED.price,
          image = EXCLUDED.image,
          cover_image = EXCLUDED.cover_image,
          featured_image = EXCLUDED.featured_image,
          short_description = EXCLUDED.short_description,
          featured = EXCLUDED.featured,
          published = EXCLUDED.published,
          itinerary = EXCLUDED.itinerary,
          updated_at = EXCLUDED.updated_at
      `;
      await db.query(queryText, [
        trekObj.id, trekObj.name, trekObj.slug, trekObj.category, trekObj.location,
        trekObj.date, trekObj.duration, trekObj.difficulty, trekObj.price, trekObj.image,
        trekObj.coverImage, trekObj.featuredImage, trekObj.shortDescription, trekObj.featured,
        trekObj.published, trekObj.itinerary, trekObj.created_at, trekObj.updated_at
      ]);
    } catch (e) {
      console.warn('DB saveTrek error, updated local store:', e.message);
    }
  }

  const local = readLocalStore();
  local.treks = local.treks || [];
  if (existingIdx !== -1) {
    local.treks[existingIdx] = trekObj;
  } else {
    local.treks.unshift(trekObj);
  }
  writeLocalStore(local);

  return trekObj;
}

async function deleteTrek(id) {
  if (db.isDbConnected()) {
    try {
      await db.query('DELETE FROM treks WHERE id = $1 OR slug = $1', [id]);
    } catch (e) {
      console.warn('DB deleteTrek error:', e.message);
    }
  }

  const local = readLocalStore();
  local.treks = (local.treks || []).filter(t => t.id !== id && t.slug !== id);
  writeLocalStore(local);

  return true;
}

// === TRIPS API ===
async function getTrips() {
  const defaultTrips = readLocalStore().trips || [];
  if (db.isDbConnected()) {
    try {
      // Clean up test rows and trigger catalog upserts asynchronously in background
      db.query("DELETE FROM trips WHERE id LIKE 'unauth%' OR id LIKE 'e2e%'").catch(() => {});

      const res = await db.query('SELECT * FROM trips WHERE id NOT LIKE \'unauth%\' AND id NOT LIKE \'e2e%\' ORDER BY created_at DESC');

      // If DB lacks catalog trips, trigger background seed without delaying GET response
      if (!res.rows || res.rows.length < defaultTrips.length) {
        Promise.all(defaultTrips.map(t => saveTrip(t).catch(() => {}))).catch(() => {});
      }

      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          title: row.name,
          slug: row.slug || row.id,
          category: row.category,
          location: row.location,
          date: row.date,
          duration: row.duration,
          price: parseFloat(row.price),
          image: row.image,
          coverImage: row.cover_image,
          shortDescription: row.short_description || row.description,
          description: row.description || row.short_description,
          itinerary: row.itinerary || '',
          inclusions: row.inclusions || ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
          published: row.published,
          created_at: Number(row.created_at),
          updated_at: Number(row.updated_at)
        }));
      }
    } catch (e) {
      console.warn('DB getTrips error:', e.message);
    }
  }
  return defaultTrips;
}

async function saveTrip(tripData) {
  const trips = await getTrips();
  const existingIdx = trips.findIndex(t => t.id === tripData.id || t.slug === tripData.id);
  const now = Date.now();
  const existingTrip = existingIdx !== -1 ? trips[existingIdx] : {};

  const tripObj = Object.assign({}, existingTrip, tripData, {
    id: tripData.id || existingTrip.id || 'trip-' + now,
    name: tripData.name || tripData.title || existingTrip.name || 'Untitled Trip',
    title: tripData.title || tripData.name || existingTrip.title || 'Untitled Trip',
    slug: tripData.slug || tripData.id || existingTrip.slug || ('trip-' + now),
    category: tripData.category || existingTrip.category || 'Weekend Getaway',
    location: tripData.location || existingTrip.location || '',
    date: tripData.date || existingTrip.date || 'Every Friday Departure',
    duration: tripData.duration || existingTrip.duration || '2 Days',
    difficulty: tripData.difficulty || existingTrip.difficulty || 'Easy',
    price: Number(tripData.price !== undefined ? tripData.price : (existingTrip.price || 0)),
    image: tripData.image || tripData.coverImage || existingTrip.image || '',
    coverImage: tripData.coverImage || tripData.image || existingTrip.coverImage || '',
    shortDescription: tripData.shortDescription || tripData.description || existingTrip.shortDescription || '',
    description: tripData.description || tripData.shortDescription || existingTrip.description || '',
    itinerary: tripData.itinerary !== undefined ? tripData.itinerary : (existingTrip.itinerary || ''),
    inclusions: tripData.inclusions || existingTrip.inclusions || ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
    published: tripData.published !== undefined ? tripData.published !== false : (existingTrip.published !== false),
    created_at: tripData.created_at || existingTrip.created_at || now,
    updated_at: now
  });

  if (db.isDbConnected()) {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS trips (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255),
          category VARCHAR(255),
          location VARCHAR(255),
          date VARCHAR(255),
          duration VARCHAR(255),
          price NUMERIC(10,2) DEFAULT 0,
          image TEXT,
          cover_image TEXT,
          description TEXT,
          short_description TEXT,
          itinerary TEXT,
          published BOOLEAN DEFAULT true,
          created_at BIGINT,
          updated_at BIGINT
        );
      `);
      await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image TEXT;`).catch(() => {});
      await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS itinerary TEXT;`).catch(() => {});
      await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS slug VARCHAR(255);`).catch(() => {});
      await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS duration VARCHAR(255);`).catch(() => {});
      await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS short_description TEXT;`).catch(() => {});

      const queryText = `
        INSERT INTO trips (id, name, slug, category, location, date, duration, price, image, cover_image, description, short_description, itinerary, published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          category = EXCLUDED.category,
          location = EXCLUDED.location,
          date = EXCLUDED.date,
          duration = EXCLUDED.duration,
          price = EXCLUDED.price,
          image = EXCLUDED.image,
          cover_image = EXCLUDED.cover_image,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          itinerary = EXCLUDED.itinerary,
          published = EXCLUDED.published,
          updated_at = EXCLUDED.updated_at
      `;
      await db.query(queryText, [
        tripObj.id, tripObj.name, tripObj.slug, tripObj.category, tripObj.location,
        tripObj.date, tripObj.duration, tripObj.price, tripObj.image,
        tripObj.coverImage, tripObj.description, tripObj.shortDescription, tripObj.itinerary,
        tripObj.published, tripObj.created_at, tripObj.updated_at
      ]);
    } catch (e) {
      console.warn('DB saveTrip error:', e.message);
    }
  }

  const local = readLocalStore();
  local.trips = local.trips || [];
  if (existingIdx !== -1) {
    local.trips[existingIdx] = tripObj;
  } else {
    local.trips.unshift(tripObj);
  }
  writeLocalStore(local);

  return tripObj;
}

async function deleteTrip(id) {
  if (db.isDbConnected()) {
    try {
      await db.query('DELETE FROM trips WHERE id = $1 OR slug = $1', [id]);
    } catch (e) {
      console.warn('DB deleteTrip error:', e.message);
    }
  }

  const local = readLocalStore();
  local.trips = (local.trips || []).filter(t => t.id !== id && t.slug !== id);
  writeLocalStore(local);

  return true;
}

// === CATEGORIES API ===
async function getCategories() {
  if (db.isDbConnected()) {
    try {
      const res = await db.query("SELECT * FROM categories WHERE LOWER(name) NOT LIKE '%test%' AND id NOT LIKE 'test-%' AND id NOT LIKE 'e2e-%' ORDER BY order_num ASC");
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug || row.id,
          description: row.description,
          image: row.image,
          order: row.order_num,
          order_num: row.order_num,
          published: row.published
        }));
      }
    } catch (e) {}
  }
  const localCats = readLocalStore().categories || DEFAULT_CATEGORIES;
  return localCats.filter(c => c && c.name && !c.name.toLowerCase().includes('test') && !c.id.startsWith('test-') && !c.id.startsWith('e2e-'));
}

async function saveCategory(catData) {
  const cats = await getCategories();
  const existingIdx = cats.findIndex(c => c.id === catData.id || c.slug === catData.id);
  const existing = existingIdx !== -1 ? cats[existingIdx] : {};

  const catObj = Object.assign({}, existing, catData, {
    id: catData.id || existing.id || ('cat-' + Date.now()),
    name: catData.name || existing.name || 'Untitled Category',
    slug: catData.slug || catData.name || existing.slug || '',
    description: catData.description || existing.description || '',
    image: catData.image || existing.image || '',
    order: catData.order !== undefined ? Number(catData.order) : (existing.order || 1),
    order_num: catData.order_num !== undefined ? Number(catData.order_num) : (existing.order_num || 1),
    published: catData.published !== undefined ? catData.published !== false : (existing.published !== false)
  });

  const local = readLocalStore();
  local.categories = local.categories || [];
  if (existingIdx !== -1) {
    local.categories[existingIdx] = catObj;
  } else {
    local.categories.push(catObj);
  }
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      await db.query(`
        INSERT INTO categories (id, name, slug, description, image, order_num, published)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          image = EXCLUDED.image,
          order_num = EXCLUDED.order_num,
          published = EXCLUDED.published
      `, [catObj.id, catObj.name, catObj.slug, catObj.description, catObj.image, catObj.order_num || catObj.order, catObj.published]);
    } catch (e) {}
  }

  return catObj;
}

async function saveCategories(categoriesList) {
  const local = readLocalStore();
  local.categories = categoriesList || DEFAULT_CATEGORIES;
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      for (let c of local.categories) {
        await saveCategory(c);
      }
    } catch (e) {}
  }

  return local.categories;
}

async function deleteCategory(id) {
  const local = readLocalStore();
  local.categories = (local.categories || []).filter(c => c.id !== id && c.slug !== id);
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      await db.query('DELETE FROM categories WHERE id = $1 OR slug = $1', [id]);
    } catch (e) {}
  }

  return true;
}

// === MEMORIES API ===
async function getMemories() {
  const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.DATABASE_URL);

  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT * FROM memories ORDER BY order_num ASC, created_at DESC');
      if (res && res.rows) {
        return res.rows.map(row => {
          const rawOrder = parseInt(row.order_num, 10);
          const rawCreated = parseInt(row.created_at, 10);
          return {
            id: String(row.id),
            image: String(row.image),
            category: row.category || 'General',
            order: isNaN(rawOrder) ? 1 : rawOrder,
            published: row.published !== false,
            created_at: isNaN(rawCreated) ? Date.now() : rawCreated
          };
        });
      }
    } catch (e) {
      console.error('❌ DB getMemories query error:', e.message);
      if (isProd) {
        throw new Error(`Database getMemories query failed: ${e.message}`);
      }
    }
  } else if (isProd) {
    throw new Error('Database connection unavailable in production environment. Ensure DATABASE_URL is set.');
  }

  return readLocalStore().memories || DEFAULT_MEMORIES;
}

async function saveMemories(memoriesList) {
  const local = readLocalStore();
  const inputList = Array.isArray(memoriesList) ? memoriesList : [];
  const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.DATABASE_URL);
  
  // Clean and validate every single memory item before DB execution
  const validMemories = [];
  for (let i = 0; i < inputList.length; i++) {
    const m = inputList[i];
    if (!m || !m.image || typeof m.image !== 'string') continue;
    const memId = String(m.id || ('mem-' + Date.now() + '-' + i));
    const rawOrder = parseInt(m.order_num || m.order, 10);
    const orderNum = isNaN(rawOrder) ? (i + 1) : rawOrder;
    const categoryVal = String(m.category || 'General');
    const isPublished = m.published !== false;
    const rawCreated = parseInt(m.created_at, 10);
    const createdAt = isNaN(rawCreated) ? Date.now() : rawCreated;

    validMemories.push({
      id: memId,
      image: m.image,
      category: categoryVal,
      order: orderNum,
      order_num: orderNum,
      published: isPublished,
      created_at: createdAt
    });
  }

  local.memories = validMemories;
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS memories (
          id VARCHAR(255) PRIMARY KEY,
          image TEXT NOT NULL,
          category VARCHAR(255) DEFAULT 'General',
          order_num INT DEFAULT 1,
          published BOOLEAN DEFAULT true,
          created_at BIGINT
        );
      `);
      await db.query(`ALTER TABLE memories ALTER COLUMN image TYPE TEXT;`).catch(() => {});

      await db.query('BEGIN');
      await db.query('DELETE FROM memories');
      for (let item of validMemories) {
        await db.query(`
          INSERT INTO memories (id, image, category, order_num, published, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [item.id, item.image, item.category, item.order_num, item.published, item.created_at]);
      }
      await db.query('COMMIT');
      console.log(`✅ Successfully persisted ${validMemories.length} memories into PostgreSQL database.`);
      return validMemories;
    } catch (e) {
      await db.query('ROLLBACK').catch(() => {});
      console.error('❌ DB saveMemories PostgreSQL error:', e.message);
      if (isProd) {
        throw new Error(`Database saveMemories failed: ${e.message}`);
      }
    }
  } else if (isProd) {
    throw new Error('Database connection unavailable in production environment. Ensure DATABASE_URL is set.');
  }

  return validMemories;
}

// === CONTENT / SETTINGS API ===
async function getContent(key, defaultValue) {
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT value FROM content WHERE key = $1', [key]);
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
    } catch (e) {}
  }
  const store = readLocalStore();
  return store[key] || defaultValue;
}

async function saveContent(key, value) {
  const store = readLocalStore();
  store[key] = value;
  writeLocalStore(store);

  if (db.isDbConnected()) {
    try {
      await db.query(`
        INSERT INTO content (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(value)]);
    } catch (e) {}
  }

  return value;
}

module.exports = {
  getTreks,
  getTrekById,
  saveTrek,
  deleteTrek,
  getTrips,
  saveTrip,
  deleteTrip,
  getCategories,
  saveCategory,
  saveCategories,
  deleteCategory,
  getMemories,
  saveMemories,
  getContent,
  saveContent,
  readLocalStore,
  writeLocalStore,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_HOMEPAGE,
  DEFAULT_MEMORIES
};
