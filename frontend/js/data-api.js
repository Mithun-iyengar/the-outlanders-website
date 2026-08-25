/* DataAPI - Centralized Content Management System Layer for The Outlanders.
   - Primary Storage: IndexedDB (Gigabyte capacity, zero quota errors)
   - Secondary Storage: localStorage (with legacy key auto-cleanup)
   - Provides clean getters/setters for frontend dynamic rendering and Admin CMS controls
*/
(function(){
  'use strict';
  const CURRENT_KEY = 'outlanders_cms_data_v8';
  const DB_NAME = 'OutlandersCMS_DB';
  const DB_VERSION = 1;
  const STORE_NAME = 'cms_data';

  // --- IndexedDB Layer (Gigabyte capacity for unlimited photo uploads) ---
  function openDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function getIDBItem(key) {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function setIDBItem(key, val) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(val, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
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
    { id: "mem-8", image: "../images/treks/netravathi/cover.jpg", category: "Western Ghats", order: 8, created_at: 1770000700000, published: true },
    { id: "mem-9", image: "../images/treks/kurinjal/cover.jpg", category: "Western Ghats", order: 9, created_at: 1770000800000, published: true },
    { id: "mem-10", image: "../images/treks/bandaje/cover.jpg", category: "Western Ghats", order: 10, created_at: 1770000900000, published: true }
  ];

  const DEFAULT_ABOUT_HTML = `
    <div class="row g-4 align-items-center">
      <div class="col-lg-8">
        <h2 class="h3 text-white fw-bold mb-3">OUR STORY & JOURNEY</h2>
        <p class="lead mb-4" style="color: var(--text-main); font-size: 1.12rem; line-height: 1.7;">
          We craft safe, memorable, and environmentally responsible experiences that connect adventure enthusiasts with the wild beauty of nature.
        </p>
        <p class="mb-4" style="color: var(--text-main); font-size: 1.02rem; line-height: 1.7;">
          As a registered adventure and travel company, <strong>The Outlanders</strong> has been creating experiences across diverse destinations, from Western Ghats treks and weekend getaways to customized trips and outdoor adventures.
        </p>
        <p class="mb-4" style="color: var(--text-main); font-size: 1.02rem; line-height: 1.7;">
          We also conduct specially planned trips and adventure programs for <strong>schools, colleges, and corporate groups</strong>, combining exploration, teamwork, learning, and unforgettable memories.
        </p>
        <p class="mb-4" style="color: var(--text-main); font-size: 1.02rem; line-height: 1.7;">
          With institutions such as <strong>BRV and PES University, Bengaluru</strong> among our recurring clients, we continue to build lasting relationships through well-organized and engaging experiences.
        </p>
        <div class="p-3 rounded-3 border" style="background: rgba(232, 106, 51, 0.12); border-color: rgba(232, 106, 51, 0.3) !important;">
          <p class="mb-0 fw-bold" style="color: #ffffff; font-size: 1.05rem; line-height: 1.6;">
            With <span style="color: var(--accent); font-size: 1.2rem;">8,000+ happy customers</span> and counting, our journey is driven by one simple belief — every adventure should be safe, meaningful, and worth remembering.
          </p>
        </div>
      </div>
      <div class="col-lg-4 text-center">
        <div class="p-4 rounded-3 border text-center h-100 d-flex flex-column justify-content-center" style="background: #0B0F0E; border-color: var(--card-border) !important;">
          <i class="bi bi-people-fill display-3 mb-3" style="color: var(--accent);"></i>
          <h3 class="display-5 fw-bold text-white mb-1">8,000+</h3>
          <p class="text-uppercase small fw-bold mb-3" style="color: var(--sand); letter-spacing: 0.1em;">Happy Adventurers</p>
          <hr class="my-3 border-secondary opacity-25">
          <div class="small text-start" style="color: var(--text-main);">
            <div class="mb-2"><i class="bi bi-building-check me-2" style="color: var(--accent);"></i> <strong>Corporate & Campus Trips</strong></div>
            <div class="mb-2"><i class="bi bi-mortarboard-fill me-2" style="color: var(--accent);"></i> <strong>PES University & BRV Partner</strong></div>
            <div><i class="bi bi-shield-check me-2" style="color: var(--accent);"></i> <strong>Registered Travel Brand</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;

  async function findExistingState(){
    try {
      // 1. Try IndexedDB FIRST! (Zero quota limits)
      const idbState = await getIDBItem(CURRENT_KEY);
      if(idbState && (idbState.treks || idbState.trips || idbState.homepage)) {
        return idbState;
      }

      // 2. Try localStorage CURRENT_KEY
      const currentRaw = localStorage.getItem(CURRENT_KEY);
      if(currentRaw){
        try{
          const parsed = JSON.parse(currentRaw);
          if(parsed && (parsed.treks || parsed.trips || parsed.homepage)){
            await setIDBItem(CURRENT_KEY, parsed);
            return parsed;
          }
        }catch(e){}
      }

      // 3. Fallback from legacy keys
      const legacyKeys = ['outlanders_cms_data_v8', 'outlanders_cms_data_v7', 'outlanders_cms_data_v6', 'outlanders_cms_data_v5', 'outlanders_cms_data'];
      for(const k of legacyKeys){
        const raw = localStorage.getItem(k);
        if(raw){
          try{
            const parsed = JSON.parse(raw);
            if(parsed && (parsed.treks || parsed.trips || parsed.homepage)){
              await setIDBItem(CURRENT_KEY, parsed);
              return parsed;
            }
          }catch(e){}
        }
      }
    } catch(e){}
    return null;
  }

  async function loadInitial(){
    const existing = await findExistingState();
    if(existing){
      if(!existing.memories || !Array.isArray(existing.memories)){
        existing.memories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
      }
      await setIDBItem(CURRENT_KEY, existing);
      try { localStorage.setItem(CURRENT_KEY, JSON.stringify(existing)); } catch(e){}
      return existing;
    }

    try{
      const [treksRes, tripsRes] = await Promise.all([fetch('../data/treks.json'), fetch('../data/trips.json')]);
      const treksJson = treksRes.ok ? await treksRes.json() : [];
      const tripsJson = tripsRes.ok ? await tripsRes.json() : [];
      const treks = Array.isArray(treksJson) ? treksJson : (treksJson.treks || treksJson);
      const trips = Array.isArray(tripsJson) ? tripsJson : (tripsJson.trips || tripsJson);
      
      const state = {
        settings: Object.assign({}, DEFAULT_SETTINGS),
        homepage: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE)),
        categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
        about: DEFAULT_ABOUT_HTML,
        treks: treks || [],
        trips: trips || [],
        memories: JSON.parse(JSON.stringify(DEFAULT_MEMORIES)),
        media: [
          { id: "m-1", name: "scroll-back.jpg", path: "../images/hero/scroll-back.jpg", usedIn: "Hero & Final CTA Background" },
          { id: "m-2", name: "roadtrip-card.jpg", path: "../images/trips/roadtrip-card.jpg", usedIn: "Road Trips Experience Card" },
          { id: "m-3", name: "kudremukha-cover.jpg", path: "../images/treks/kudremukha/cover.jpg", usedIn: "Kudremukha Trek Cover" },
          { id: "m-4", name: "intro.jpg", path: "../images/intro/intro.jpg", usedIn: "About & Adventure Card" }
        ]
      };
      await setIDBItem(CURRENT_KEY, state);
      try { localStorage.setItem(CURRENT_KEY, JSON.stringify(state)); } catch(e){}
      return state;
    }catch(err){
      console.error('DataAPI init error', err);
      const emptyState = {
        settings: DEFAULT_SETTINGS,
        homepage: DEFAULT_HOMEPAGE,
        categories: DEFAULT_CATEGORIES,
        about: DEFAULT_ABOUT_HTML,
        treks: [],
        trips: [],
        memories: DEFAULT_MEMORIES,
        media: []
      };
      await setIDBItem(CURRENT_KEY, emptyState);
      try { localStorage.setItem(CURRENT_KEY, JSON.stringify(emptyState)); } catch(e){}
      return emptyState;
    }
  }

  async function getState(){
    const existing = await findExistingState();
    if(existing){
      if(!existing.memories || !Array.isArray(existing.memories)){
        existing.memories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
      }
      return existing;
    }
    return await loadInitial();
  }

  async function saveState(state){
    // 1. Save to IndexedDB (Gigabyte capacity for unlimited photos!)
    await setIDBItem(CURRENT_KEY, state);

    // 2. Clean up old legacy keys to free space in localStorage
    ['outlanders_cms_data_v7', 'outlanders_cms_data_v6', 'outlanders_cms_data_v5', 'outlanders_cms_data'].forEach(k => {
      try { localStorage.removeItem(k); } catch(e){}
    });

    // 3. Save to localStorage as secondary cache
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
    } catch(e) {
      console.warn('LocalStorage full, state saved cleanly to IndexedDB.');
    }

    window.dispatchEvent(new CustomEvent('cms-data-updated', { detail: state }));
    return state;
  }

  window.addEventListener('storage', (e) => {
    if(e.key && e.key.startsWith('outlanders_cms_data')){
      window.dispatchEvent(new CustomEvent('cms-data-updated'));
    }
  });

  async function resetToDefaults(){
    try {
      const db = await openDB();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
      }
      for(let i = localStorage.length - 1; i >= 0; i--){
        const k = localStorage.key(i);
        if(k && k.startsWith('outlanders_cms_data')) localStorage.removeItem(k);
      }
    } catch(e){}
    return await loadInitial();
  }

  // Site Settings
  async function getSiteSettings(){
    const s = await getState();
    return Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
  }

  async function updateSiteSettings(newSettings){
    const state = await getState();
    state.settings = Object.assign({}, DEFAULT_SETTINGS, state.settings || {}, newSettings);
    await saveState(state);
    return state.settings;
  }

  // Homepage Content
  async function getHomepageContent(){
    const s = await getState();
    return s.homepage || DEFAULT_HOMEPAGE;
  }

  async function updateHomepageContent(newHomepage){
    const state = await getState();
    state.homepage = Object.assign({}, DEFAULT_HOMEPAGE, state.homepage || {}, newHomepage);
    await saveState(state);
    return state.homepage;
  }

  async function getHeroImage(){
    const hp = await getHomepageContent();
    return (hp.hero && hp.hero.bgImage) || "../images/hero/scroll-back.jpg";
  }

  async function updateHeroImage(url){
    const hp = await getHomepageContent();
    if(!hp.hero) hp.hero = {};
    hp.hero.bgImage = url;
    await updateHomepageContent(hp);
    return url;
  }

  async function getCategoryImages(){
    const hp = await getHomepageContent();
    const cards = (hp.discover && hp.discover.cards) || [];
    return {
      treks: cards[0] ? cards[0].image : "../images/treks/kudremukha/cover.jpg",
      roadtrips: cards[1] ? cards[1].image : "../images/trips/roadtrip-card.jpg",
      adventure: cards[2] ? cards[2].image : "../images/intro/intro.jpg"
    };
  }

  async function updateCategoryImages(obj){
    const hp = await getHomepageContent();
    if(!hp.discover) hp.discover = { cards: [] };
    if(hp.discover.cards.length >= 3){
      if(obj.treks) hp.discover.cards[0].image = obj.treks;
      if(obj.roadtrips) hp.discover.cards[1].image = obj.roadtrips;
      if(obj.adventure) hp.discover.cards[2].image = obj.adventure;
    }
    await updateHomepageContent(hp);
    return obj;
  }

  // Categories CRUD
  async function getCategories(){
    const s = await getState();
    return s.categories || DEFAULT_CATEGORIES;
  }

  async function createCategory(cat){
    const state = await getState();
    state.categories = state.categories || [];
    cat.id = cat.id || 'cat-' + Date.now();
    state.categories.push(cat);
    await saveState(state);
    return cat;
  }

  async function updateCategory(id, updated){
    const state = await getState();
    state.categories = state.categories || [];
    const idx = state.categories.findIndex(c => c.id === id || c.slug === id);
    if(idx === -1) throw new Error('Category not found');
    state.categories[idx] = Object.assign({}, state.categories[idx], updated);
    await saveState(state);
    return state.categories[idx];
  }

  async function deleteCategory(id){
    const state = await getState();
    state.categories = (state.categories || []).filter(c => c.id !== id && c.slug !== id);
    await saveState(state);
    return true;
  }

  // Treks CRUD
  async function getTreks(){
    const s = await getState();
    return s.treks || [];
  }

  async function getTrekById(id){
    const treks = await getTreks();
    return treks.find(t => t.id === id || t.slug === id) || null;
  }

  async function createTrek(trek){
    const state = await getState();
    state.treks = state.treks || [];
    state.treks.unshift(trek);
    await saveState(state);
    return trek;
  }

  async function updateTrek(id, updated){
    const state = await getState();
    state.treks = state.treks || [];
    const idx = state.treks.findIndex(t => t.id === id || t.slug === id);
    if(idx === -1) throw new Error('Trek not found');
    state.treks[idx] = Object.assign({}, state.treks[idx], updated);
    await saveState(state);
    return state.treks[idx];
  }

  async function deleteTrek(id){
    const state = await getState();
    state.treks = (state.treks || []).filter(t => t.id !== id && t.slug !== id);
    await saveState(state);
    return true;
  }

  async function duplicateTrek(id, newId){
    const trek = await getTrekById(id);
    if(!trek) throw new Error('Not found');
    const copy = JSON.parse(JSON.stringify(trek));
    copy.id = newId;
    copy.slug = newId;
    copy.published = false;
    copy.name = copy.name + ' (Copy)';
    return await createTrek(copy);
  }

  // Trips CRUD
  async function getTrips(){
    const s = await getState();
    return s.trips || [];
  }

  async function getTripById(id){
    const trips = await getTrips();
    return trips.find(t => t.id === id || t.slug === id) || null;
  }

  async function createTrip(trip){
    const state = await getState();
    state.trips = state.trips || [];
    state.trips.unshift(trip);
    await saveState(state);
    return trip;
  }

  async function updateTrip(id, updated){
    const state = await getState();
    state.trips = state.trips || [];
    const idx = state.trips.findIndex(t => t.id === id || t.slug === id);
    if(idx === -1) throw new Error('Trip not found');
    state.trips[idx] = Object.assign({}, state.trips[idx], updated);
    await saveState(state);
    return state.trips[idx];
  }

  async function deleteTrip(id){
    const state = await getState();
    state.trips = (state.trips || []).filter(t => t.id !== id && t.slug !== id);
    await saveState(state);
    return true;
  }

  // Memories CRUD
  async function getMemories(){
    const s = await getState();
    return s.memories || DEFAULT_MEMORIES;
  }

  async function updateMemories(memoriesList){
    const state = await getState();
    state.memories = memoriesList || [];
    await saveState(state);
    return state.memories;
  }

  // About Content
  async function getAbout(){
    const s = await getState();
    return s.about || DEFAULT_ABOUT_HTML;
  }

  async function updateAbout(html){
    const state = await getState();
    state.about = html;
    await saveState(state);
    return state.about;
  }

  // Media Library
  async function getMediaList(){
    const s = await getState();
    return s.media || [];
  }

  async function addMedia(item){
    const state = await getState();
    state.media = state.media || [];
    item.id = item.id || 'm-' + Date.now();
    state.media.unshift(item);
    await saveState(state);
    return item;
  }

  async function deleteMedia(id){
    const state = await getState();
    state.media = (state.media || []).filter(m => m.id !== id);
    await saveState(state);
    return true;
  }

  // Expose API globally
  window.DataAPI = {
    init: loadInitial,
    resetToDefaults,
    getSiteSettings, updateSiteSettings,
    getHomepageContent, updateHomepageContent,
    getHeroImage, updateHeroImage,
    getCategoryImages, updateCategoryImages,
    getCategories, createCategory, updateCategory, deleteCategory,
    getTreks, getTrekById, createTrek, updateTrek, deleteTrek, duplicateTrek,
    getTrips, getTripById, createTrip, updateTrip, deleteTrip,
    getMemories, updateMemories,
    getAbout, updateAbout,
    getMediaList, addMedia, deleteMedia
  };

  loadInitial();

})();
