/* treks.js
   - fetchTreks(): load treks.json or DataAPI
   - renderFeaturedTreks(): fill homepage featured list
   - renderTrekCards(): render trek grid (treks.html)
   - renderTrekDetails(): render single trek/trip, itinerary PDF, & package inclusions (trek-details.html)
   - renderTrips(): render trip grid from DataAPI or trips.json (trips.html)
*/
(function(){
  'use strict';
  const DATA_PATH = '../data/treks.json';

  function escapeHtml(str){
    if(!str && str!==0) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function fetchTreks(){
    try{
      if(window.DataAPI && typeof window.DataAPI.getTreks === 'function'){
        return await window.DataAPI.getTreks();
      }
      const res = await fetch(DATA_PATH);
      if(!res.ok) throw new Error('Failed to load treks');
      const json = await res.json();
      return Array.isArray(json) ? json : json.treks || [];
    }catch(err){
      console.error(err);
      return [];
    }
  }

  function imageFallbackSrc(){
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='%230b1412'/><text x='50%' y='50%' fill='%235dc7aa' font-size='20' font-family='Sora, Arial' text-anchor='middle' dy='.3em'>THE OUTLANDERS</text></svg>";
  }

  // Single reusable card renderer used everywhere
  function renderTrekCard(trek, index = 0){
    const image = (trek.coverImage || trek.image || '').replace(/"/g,'');
    const safeImageEsc = image.replace(/'/g,'%27') || imageFallbackSrc();
    const priceHTML = (trek.price || trek.price === 0) ? `₹${Number(trek.price).toLocaleString('en-IN')}` : 'Contact Us';
    const dateText = trek.date || 'Every Friday Departure';
    const revealDelay = (trek._revealIndex !== undefined ? trek._revealIndex : index) * 100;
    const cardId = trek.id || trek.slug;

    return `
      <div class="col-12 col-md-6 col-lg-4 reveal reveal-up" style="--reveal-delay:${revealDelay}ms">
        <div class="trek-card" data-id="${escapeHtml(cardId)}">
          <div class="card-img" role="img" aria-label="${escapeHtml(trek.name || trek.title)}">
            <img src="${escapeHtml(safeImageEsc)}" alt="${escapeHtml(trek.name || trek.title)}" loading="lazy" onerror="this.onerror=null;this.src='${imageFallbackSrc()}'" />
            <div class="location-badge"><i class="bi bi-geo-alt-fill me-1"></i>${escapeHtml(trek.category || trek.location || 'Western Ghats')}</div>
          </div>
          <div class="card-body">
            <h5 class="trek-title">${escapeHtml(trek.name || trek.title)}</h5>
            <div class="trek-meta">
              <span><i class="bi bi-geo-alt-fill" aria-hidden="true"></i><b>Location</b>${escapeHtml(trek.location || 'TBA')}</span>
              <span><i class="bi bi-calendar3" aria-hidden="true"></i><b>Schedule</b>${escapeHtml(dateText)}</span>
              <span><i class="bi bi-person-walking" aria-hidden="true"></i><b>Difficulty</b>${escapeHtml(trek.difficulty || 'Moderate')}</span>
              <span><i class="bi bi-clock-history" aria-hidden="true"></i><b>Duration</b>${escapeHtml(trek.duration || '2 Days')}</span>
            </div>
            <p class="trek-desc">${escapeHtml(trek.shortDescription || trek.description || '')}</p>
            <div class="card-actions-wrapper">
              <div class="price">${priceHTML}</div>
              <div class="card-actions">
                <a href="trek-details.html?id=${encodeURIComponent(cardId)}" class="btn btn-outline-light">DETAILS</a>
                <button class="btn btn-cta" data-name="${escapeHtml(trek.name || trek.title)}" data-date="${escapeHtml(dateText)}" data-location="${escapeHtml(trek.location)}" onclick="handleBooking(this)">BOOK NOW <i class="bi bi-arrow-right" aria-hidden="true"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderFeaturedTreks(containerSelector = '#featured-treks'){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const treks = await fetchTreks();
    const featured = treks.filter(t => t.featured && t.published).slice(0, 6);
    container.innerHTML = featured.map((trek, index) => renderTrekCard(trek, index)).join('');
    observeNewlyRendered(container);
  }

  async function renderFeaturedDestinations(containerSelector = '#featured-destinations'){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const treks = await fetchTreks();
    const featured = treks.filter(t => t.featured && t.published).slice(0, 6);
    container.innerHTML = featured.map(trek => {
      const image = trek.coverImage || trek.image || trek.featuredImage || imageFallbackSrc();
      return `
        <div class="col-12 col-md-6 col-lg-4 reveal reveal-up">
          <a class="destination-card" href="trek-details.html?id=${encodeURIComponent(trek.id || trek.slug)}">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(trek.name || trek.title)}" loading="lazy" onerror="this.onerror=null;this.src='${imageFallbackSrc()}'">
            <span>${escapeHtml(trek.name || trek.title)}</span>
          </a>
        </div>
      `;
    }).join('');
    observeNewlyRendered(container);
  }

  async function renderTrekCards(containerSelector = '#trek-list', options = { publishedOnly: true }){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const treks = await fetchTreks();
    const list = options.publishedOnly ? treks.filter(t => t.published !== false) : treks;
    container.innerHTML = list.map((trek, index) => renderTrekCard(trek, index)).join('');
    observeNewlyRendered(container);
  }

  async function renderTrips(containerSelector = '#trip-list'){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    try{
      let trips = [];
      if(window.DataAPI && typeof window.DataAPI.getTrips === 'function'){
        trips = await window.DataAPI.getTrips();
      } else {
        const res = await fetch('../data/trips.json');
        if(!res.ok) throw new Error('Trips not found');
        const json = await res.json();
        trips = Array.isArray(json) ? json : json.trips || [];
      }
      const html = trips.filter(t => t.published !== false).map((t, index) => renderTrekCard(Object.assign({}, t, { id: t.slug || t.id }), index)).join('');
      container.innerHTML = html;
      observeNewlyRendered(container);
    }catch(err){
      console.error(err);
    }
  }

  async function renderTrekDetails(containerSelector = '#trek-detail'){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    if(!rawId){
      container.innerHTML = '<div class="col-12 text-center py-5"><h4>Experience not specified.</h4><a href="treks.html" class="btn btn-cta mt-3">Browse All Experiences</a></div>';
      return;
    }

    const cleanId = decodeURIComponent(rawId).trim().toLowerCase();

    let treks = [];
    let trips = [];
    if(window.DataAPI){
      if(typeof window.DataAPI.getTreks === 'function') treks = await window.DataAPI.getTreks();
      if(typeof window.DataAPI.getTrips === 'function') trips = await window.DataAPI.getTrips();
    } else {
      try {
        const [r1, r2] = await Promise.all([fetch('../data/treks.json'), fetch('../data/trips.json')]);
        if(r1.ok){ const j1 = await r1.json(); treks = Array.isArray(j1) ? j1 : (j1.treks || []); }
        if(r2.ok){ const j2 = await r2.json(); trips = Array.isArray(j2) ? j2 : (j2.trips || []); }
      } catch(e){}
    }

    const allItems = [...treks, ...trips];
    const trek = allItems.find(t => {
      if(!t) return false;
      const tid = String(t.id || '').trim().toLowerCase();
      const tslug = String(t.slug || '').trim().toLowerCase();
      const tname = String(t.name || '').trim().toLowerCase();
      const ttitle = String(t.title || '').trim().toLowerCase();
      return tid === cleanId || tslug === cleanId || tname === cleanId || ttitle === cleanId || tid.includes(cleanId) || cleanId.includes(tid);
    });

    if(!trek){
      container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-compass display-3 text-muted mb-3 d-block"></i><h4 class="text-white">Experience Details Unavailable</h4><p class="text-muted">The requested trek or trip could not be found.</p><a href="treks.html" class="btn btn-cta mt-3">Browse All Experiences</a></div>';
      return;
    }

    const priceFormatted = (trek.price || trek.price === 0) ? `₹${Number(trek.price).toLocaleString('en-IN')}` : 'Contact for Price';
    const dateText = trek.date || 'Every Friday Departure';
    const imageSrc = trek.featuredImage || trek.coverImage || trek.image || imageFallbackSrc();

    // Package Inclusions
    let inclusionsList = ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'];
    if(trek.inclusions){
      if(Array.isArray(trek.inclusions) && trek.inclusions.length > 0){
        inclusionsList = trek.inclusions;
      } else if(typeof trek.inclusions === 'string' && trek.inclusions.trim()){
        inclusionsList = trek.inclusions.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
    }

    const heroHTML = `
      <div class="col-lg-8 reveal reveal-left">
        <div class="trek-detail-media rounded-3 overflow-hidden mb-4 shadow-lg border border-secondary border-opacity-25">
          <img class="trek-detail-image w-100" style="max-height: 440px; object-fit: cover;" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(trek.name || trek.title)}" onerror="this.onerror=null;this.src='${imageFallbackSrc()}'">
        </div>
        <h1 class="display-6 fw-bold text-white mb-3">${escapeHtml(trek.name || trek.title)}</h1>
        
        <!-- High-Contrast Prominent Meta Pills -->
        <div class="d-flex flex-wrap gap-2 align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div class="px-3 py-2 rounded-3 border shadow-sm" style="background: rgba(14, 20, 18, 0.95); border-color: rgba(255, 255, 255, 0.18) !important;">
            <small class="text-uppercase font-monospace fw-bold d-block text-warning" style="font-size: 0.68rem; letter-spacing: 0.08em;">LOCATION</small>
            <span class="fw-bold text-white fs-6"><i class="bi bi-geo-alt-fill text-warning me-1"></i> ${escapeHtml(trek.location || 'Western Ghats')}</span>
          </div>

          <div class="px-3 py-2 rounded-3 border shadow-sm" style="background: rgba(14, 20, 18, 0.95); border-color: rgba(255, 255, 255, 0.18) !important;">
            <small class="text-uppercase font-monospace fw-bold d-block text-warning" style="font-size: 0.68rem; letter-spacing: 0.08em;">DEPARTURE SCHEDULE</small>
            <span class="fw-bold text-white fs-6"><i class="bi bi-calendar3 text-warning me-1"></i> ${escapeHtml(dateText)}</span>
          </div>

          <div class="px-3 py-2 rounded-3 border shadow-sm" style="background: rgba(14, 20, 18, 0.95); border-color: rgba(255, 255, 255, 0.18) !important;">
            <small class="text-uppercase font-monospace fw-bold d-block text-warning" style="font-size: 0.68rem; letter-spacing: 0.08em;">DIFFICULTY</small>
            <span class="fw-bold text-white fs-6"><i class="bi bi-person-walking text-warning me-1"></i> ${escapeHtml(trek.difficulty || 'Easy')}</span>
          </div>

          <div class="px-3 py-2 rounded-3 border shadow-sm" style="background: rgba(14, 20, 18, 0.95); border-color: rgba(255, 255, 255, 0.18) !important;">
            <small class="text-uppercase font-monospace fw-bold d-block text-warning" style="font-size: 0.68rem; letter-spacing: 0.08em;">DURATION</small>
            <span class="fw-bold text-white fs-6"><i class="bi bi-clock-history text-warning me-1"></i> ${escapeHtml(trek.duration || '2 Days')}</span>
          </div>
        </div>

        <h4 class="h5 fw-bold text-white mb-3">About The Experience</h4>
        <p class="lead text-light mb-4" style="font-size: 1.05rem; line-height: 1.7;">${escapeHtml(trek.shortDescription || trek.description || '')}</p>
        
        <h4 class="h5 fw-bold text-white mb-3">Detailed Itinerary PDF Document</h4>
        ${trek.itinerary ? `
          <div class="p-3 rounded-3 mb-4 border border-secondary border-opacity-25" style="background: rgba(255,255,255,0.04);">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h5 class="fw-bold text-white mb-1"><i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Detailed Itinerary PDF</h5>
                <p class="small text-white-50 mb-0">Download or view the uploaded day-by-day itinerary document.</p>
              </div>
              <a class="btn btn-outline-light fw-bold px-4 py-2" href="${escapeHtml(trek.itinerary)}" target="_blank" rel="noopener noreferrer" download="${escapeHtml(trek.name || 'Trek')}-Itinerary.pdf">
                <i class="bi bi-file-earmark-pdf me-1"></i> VIEW / DOWNLOAD PDF
              </a>
            </div>
          </div>
        ` : `
          <div class="p-3 rounded-3 mb-4 border border-secondary border-opacity-25" style="background: rgba(255,255,255,0.02);">
            <p class="text-white-50 mb-2">Detailed day-by-day itinerary is available on request.</p>
            <a class="btn btn-sm btn-outline-light fw-bold" href="https://wa.me/917795167667?text=Hi%20The%20Outlanders,%20please%20send%20me%20the%20itinerary%20for%20${encodeURIComponent(trek.name || trek.title)}" target="_blank">
              <i class="bi bi-whatsapp text-success me-1"></i> Request PDF on WhatsApp
            </a>
          </div>
        `}
      </div>
    `;

    const bookingHTML = `
      <div class="col-lg-4 reveal reveal-right">
        <div class="sticky-book p-4 rounded-3 shadow-lg border border-secondary border-opacity-25" style="background: rgba(17, 32, 28, 0.95); backdrop-filter: blur(10px);">
          <div class="text-uppercase small text-warning font-monospace fw-bold mb-1">Standard Package</div>
          <h3 class="display-6 fw-bold text-warning mb-1">${priceFormatted}</h3>
          <p class="fs-6 fw-bold text-white mb-3"><i class="bi bi-clock me-1 text-warning"></i>${escapeHtml(trek.duration || '2 Days')} · <i class="bi bi-calendar3 ms-1 me-1 text-warning"></i>${escapeHtml(dateText)}</p>
          <hr class="border-secondary border-opacity-25 my-3">
          <ul class="list-unstyled small text-light space-y-2 mb-4">
            ${inclusionsList.map(inc => `<li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i> ${escapeHtml(inc)}</li>`).join('')}
          </ul>
          <button class="btn btn-cta w-100 py-3 text-uppercase fw-bold" data-name="${escapeHtml(trek.name || trek.title)}" data-date="${escapeHtml(dateText)}" data-location="${escapeHtml(trek.location || 'Western Ghats')}" onclick="handleBooking(this)">
            BOOK ON WHATSAPP <i class="bi bi-whatsapp ms-2"></i>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = heroHTML + bookingHTML;

    // Mobile sticky booking bar
    const mobileBooking = document.getElementById('mobile-booking-bar');
    if(mobileBooking){
      mobileBooking.innerHTML = `
        <div class="price-info">
          <strong>${priceFormatted}</strong>
          <span class="text-white-50">per person</span>
        </div>
        <button class="btn btn-cta" data-name="${escapeHtml(trek.name || trek.title)}" data-date="${escapeHtml(dateText)}" data-location="${escapeHtml(trek.location || 'Western Ghats')}" onclick="handleBooking(this)">
          BOOK ON WHATSAPP <i class="bi bi-whatsapp ms-1"></i>
        </button>
      `;
      document.body.classList.add('has-mobile-booking-bar');
    }

    observeNewlyRendered(container);
  }

  // Trigger scroll reveal observer for dynamically rendered nodes
  function observeNewlyRendered(parentEl){
    if(!parentEl) return;
    const revealItems = parentEl.querySelectorAll('.reveal');
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      revealItems.forEach(item => item.classList.add('is-visible'));
      return;
    }
    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }
  }

  // Expose Treks API
  window.Treks = {
    fetchTreks,
    renderFeaturedTreks,
    renderFeaturedDestinations,
    renderTrekCards,
    renderTrekDetails,
    renderTrips,
    renderTrekCard
  };

  window.addEventListener('cms-data-updated', () => {
    renderTrips();
    renderTrekCards();
    renderTrekDetails();
  });

  document.addEventListener('DOMContentLoaded', function(){
    renderFeaturedTreks();
    renderFeaturedDestinations();
    renderTrekCards();
    renderTrips();
    renderTrekDetails();
  });

})();
