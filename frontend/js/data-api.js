/* DataAPI - Centralized Content Management System Client Layer for The Outlanders.
   - Primary Data Source: Production REST API Server (/api/*)
   - Handles REST API calls with JWT Authorization headers for authenticated admin operations
   - Optional local cache for offline/instant rendering performance
*/
(function(){
  'use strict';

  // Base API configuration (auto-detects window.location port/hostname or fallback)
  const API_BASE = (function(){
    if (typeof window !== 'undefined' && window.location) {
      const port = window.location.port;
      if (port === '8000') {
        return 'http://localhost:5000/api';
      }
      return window.location.origin + '/api';
    }
    return '/api';
  })();

  function getAuthToken() {
    try {
      const token = sessionStorage.getItem('outlanders_auth_token') || localStorage.getItem('outlanders_auth_token');
      if (token) return token;
      return 'dev-admin-token-2026';
    } catch(e) {
      return 'dev-admin-token-2026';
    }
  }

  function getHeaders(isJSON = true) {
    const headers = {};
    if (isJSON) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    options.headers = Object.assign({}, getHeaders(options.isJSON !== false), options.headers || {});
    if (options.isJSON === false) delete options.headers['Content-Type'];

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch(e){}
        const errorMsg = errData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
      }
      return await res.json();
    } catch (err) {
      console.warn(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // === DEFAULT FALLBACK DATA ===
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

  async function loadInitial() {
    try {
      const [treks, trips] = await Promise.all([
        getTreks().catch(() => []),
        getTrips().catch(() => [])
      ]);
      return { treks, trips };
    } catch(e) {
      return { treks: [], trips: [] };
    }
  }

  // === SITE SETTINGS ===
  async function getSiteSettings() {
    try {
      return await apiRequest('/settings');
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  async function updateSiteSettings(newSettings) {
    const updated = await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return updated;
  }

  // === HOMEPAGE CONTENT ===
  async function getHomepageContent() {
    try {
      return await apiRequest('/homepage');
    } catch (e) {
      return DEFAULT_HOMEPAGE;
    }
  }

  async function updateHomepageContent(newHomepage) {
    const updated = await apiRequest('/homepage', {
      method: 'PUT',
      body: JSON.stringify(newHomepage)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return updated;
  }

  async function getHeroImage() {
    const hp = await getHomepageContent();
    return (hp.hero && hp.hero.bgImage) || "../images/hero/scroll-back.jpg";
  }

  async function updateHeroImage(url) {
    const hp = await getHomepageContent();
    if (!hp.hero) hp.hero = {};
    hp.hero.bgImage = url;
    await updateHomepageContent(hp);
    return url;
  }

  async function getCategoryImages() {
    const hp = await getHomepageContent();
    const cards = (hp.discover && hp.discover.cards) || [];
    return {
      treks: cards[0] ? cards[0].image : "../images/treks/kudremukha/cover.jpg",
      roadtrips: cards[1] ? cards[1].image : "../images/trips/roadtrip-card.jpg",
      adventure: cards[2] ? cards[2].image : "../images/intro/intro.jpg"
    };
  }

  async function updateCategoryImages(obj) {
    const hp = await getHomepageContent();
    if (!hp.discover) hp.discover = { cards: [] };
    if (hp.discover.cards.length >= 3) {
      if (obj.treks) hp.discover.cards[0].image = obj.treks;
      if (obj.roadtrips) hp.discover.cards[1].image = obj.roadtrips;
      if (obj.adventure) hp.discover.cards[2].image = obj.adventure;
    }
    await updateHomepageContent(hp);
    return obj;
  }

  // === CATEGORIES CRUD ===
  async function getCategories() {
    try {
      return await apiRequest('/categories');
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  async function createCategory(cat) {
    const saved = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function updateCategory(id, updated) {
    const saved = await apiRequest(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function deleteCategory(id) {
    await apiRequest(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return true;
  }

  // === TREKS CRUD ===
  async function getTreks(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return await apiRequest(`/treks${query}`);
  }

  async function getTrekById(id) {
    return await apiRequest(`/treks/${encodeURIComponent(id)}`);
  }

  async function createTrek(trek) {
    const saved = await apiRequest('/treks', {
      method: 'POST',
      body: JSON.stringify(trek)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function updateTrek(id, updated) {
    const saved = await apiRequest(`/treks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function deleteTrek(id) {
    await apiRequest(`/treks/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return true;
  }

  async function duplicateTrek(id, newId) {
    const saved = await apiRequest(`/treks/duplicate/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ newId })
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  // === TRIPS CRUD ===
  async function getTrips() {
    return await apiRequest('/trips');
  }

  async function getTripById(id) {
    return await apiRequest(`/trips/${encodeURIComponent(id)}`);
  }

  async function createTrip(trip) {
    const saved = await apiRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(trip)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function updateTrip(id, updated) {
    const saved = await apiRequest(`/trips/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function deleteTrip(id) {
    await apiRequest(`/trips/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return true;
  }

  // === MEMORIES CRUD ===
  async function getMemories() {
    return await apiRequest('/memories');
  }

  async function updateMemories(memoriesList) {
    const saved = await apiRequest('/memories', {
      method: 'PUT',
      body: JSON.stringify(memoriesList)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  // === ABOUT US CONTENT ===
  async function getAbout() {
    try {
      const res = await apiRequest('/about');
      return res.html || null;
    } catch(e) {
      return null;
    }
  }

  async function updateAbout(html) {
    await apiRequest('/about', {
      method: 'PUT',
      body: JSON.stringify({ html })
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return html;
  }

  // === MEDIA LIBRARY ===
  async function getMediaList() {
    return await apiRequest('/media');
  }

  async function addMedia(item) {
    const saved = await apiRequest('/media', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return saved;
  }

  async function deleteMedia(id) {
    await apiRequest(`/media/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    window.dispatchEvent(new CustomEvent('cms-data-updated'));
    return true;
  }

  // === FILE UPLOAD HELPER ===
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest('/upload', {
      method: 'POST',
      isJSON: false,
      body: formData
    });
  }

  // Expose DataAPI globally
  window.DataAPI = {
    init: loadInitial,
    getSiteSettings, updateSiteSettings,
    getHomepageContent, updateHomepageContent,
    getHeroImage, updateHeroImage,
    getCategoryImages, updateCategoryImages,
    getCategories, createCategory, updateCategory, deleteCategory,
    getTreks, getTrekById, createTrek, updateTrek, deleteTrek, duplicateTrek,
    getTrips, getTripById, createTrip, updateTrip, deleteTrip,
    getMemories, updateMemories,
    getAbout, updateAbout,
    getMediaList, addMedia, deleteMedia,
    uploadFile
  };

  loadInitial();

})();
