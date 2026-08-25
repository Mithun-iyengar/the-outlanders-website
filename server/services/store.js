// server/services/store.js - Unified Data Access Layer (PostgreSQL + Local File Storage Backup)
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const TREKS_FILE = path.join(DATA_DIR, 'treks.json');
const TRIPS_FILE = path.join(DATA_DIR, 'trips.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
  } catch (e) {
    console.error('Error reading local store:', e);
  }

  return store;
}

function writeLocalStore(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
    if (store.treks) fs.writeFileSync(TREKS_FILE, JSON.stringify(store.treks, null, 2), 'utf8');
    if (store.trips) fs.writeFileSync(TRIPS_FILE, JSON.stringify(store.trips, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local store:', e);
  }
}

// === TREKS API ===
async function getTreks() {
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT * FROM treks ORDER BY created_at DESC');
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
        featured: row.featured,
        published: row.published,
        itinerary: row.itinerary,
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at)
      }));
    } catch (e) {
      console.warn('DB getTreks error, fallback to file:', e.message);
    }
  }
  return readLocalStore().treks || [];
}

async function getTrekById(id) {
  const treks = await getTreks();
  return treks.find(t => t.id === id || t.slug === id) || null;
}

async function saveTrek(trekData) {
  const treks = await getTreks();
  const existingIdx = treks.findIndex(t => t.id === trekData.id || t.slug === trekData.id);
  const now = Date.now();

  const trekObj = {
    id: trekData.id || 'trek-' + now,
    name: trekData.name || 'Untitled Trek',
    slug: trekData.slug || trekData.id || ('trek-' + now),
    category: trekData.category || 'Western Ghats',
    location: trekData.location || '',
    date: trekData.date || 'Every Friday Departure',
    duration: trekData.duration || '2 Days',
    difficulty: trekData.difficulty || 'Moderate',
    price: Number(trekData.price || 0),
    image: trekData.image || '',
    coverImage: trekData.coverImage || trekData.image || '',
    featuredImage: trekData.featuredImage || '',
    shortDescription: trekData.shortDescription || '',
    featured: Boolean(trekData.featured),
    published: trekData.published !== false,
    itinerary: trekData.itinerary || '',
    created_at: trekData.created_at || now,
    updated_at: now
  };

  if (db.isDbConnected()) {
    try {
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
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT * FROM trips ORDER BY created_at DESC');
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug || row.id,
        category: row.category,
        location: row.location,
        date: row.date,
        duration: row.duration,
        price: parseFloat(row.price),
        image: row.image,
        coverImage: row.cover_image,
        description: row.description,
        published: row.published,
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at)
      }));
    } catch (e) {
      console.warn('DB getTrips error:', e.message);
    }
  }
  return readLocalStore().trips || [];
}

async function saveTrip(tripData) {
  const trips = await getTrips();
  const existingIdx = trips.findIndex(t => t.id === tripData.id || t.slug === tripData.id);
  const now = Date.now();

  const tripObj = {
    id: tripData.id || 'trip-' + now,
    name: tripData.name || 'Untitled Trip',
    slug: tripData.slug || tripData.id || ('trip-' + now),
    category: tripData.category || 'Weekend Getaway',
    location: tripData.location || '',
    date: tripData.date || 'Every Friday Departure',
    duration: tripData.duration || '2 Days',
    price: Number(tripData.price || 0),
    image: tripData.image || '',
    coverImage: tripData.coverImage || tripData.image || '',
    description: tripData.description || '',
    published: tripData.published !== false,
    created_at: tripData.created_at || now,
    updated_at: now
  };

  if (db.isDbConnected()) {
    try {
      const queryText = `
        INSERT INTO trips (id, name, slug, category, location, date, duration, price, image, cover_image, description, published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          published = EXCLUDED.published,
          updated_at = EXCLUDED.updated_at
      `;
      await db.query(queryText, [
        tripObj.id, tripObj.name, tripObj.slug, tripObj.category, tripObj.location,
        tripObj.date, tripObj.duration, tripObj.price, tripObj.image,
        tripObj.coverImage, tripObj.description, tripObj.published, tripObj.created_at, tripObj.updated_at
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
      const res = await db.query('SELECT * FROM categories ORDER BY order_num ASC');
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug || row.id,
          description: row.description,
          image: row.image,
          order: row.order_num,
          published: row.published
        }));
      }
    } catch (e) {}
  }
  return readLocalStore().categories || DEFAULT_CATEGORIES;
}

async function saveCategories(categoriesList) {
  const local = readLocalStore();
  local.categories = categoriesList || DEFAULT_CATEGORIES;
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      for (let c of local.categories) {
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
        `, [c.id || 'cat-' + Date.now(), c.name, c.slug || c.name, c.description || '', c.image || '', c.order || 1, c.published !== false]);
      }
    } catch (e) {}
  }

  return local.categories;
}

// === MEMORIES API ===
async function getMemories() {
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT * FROM memories ORDER BY order_num ASC, created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          image: row.image,
          category: row.category,
          order: row.order_num,
          published: row.published,
          created_at: Number(row.created_at)
        }));
      }
    } catch (e) {}
  }
  return readLocalStore().memories || DEFAULT_MEMORIES;
}

async function saveMemories(memoriesList) {
  const local = readLocalStore();
  local.memories = memoriesList || DEFAULT_MEMORIES;
  writeLocalStore(local);

  if (db.isDbConnected()) {
    try {
      await db.query('DELETE FROM memories');
      for (let m of local.memories) {
        await db.query(`
          INSERT INTO memories (id, image, category, order_num, published, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [m.id || 'mem-' + Date.now(), m.image, m.category || 'General', m.order || 1, m.published !== false, m.created_at || Date.now()]);
      }
    } catch (e) {}
  }

  return local.memories;
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
  saveCategories,
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
