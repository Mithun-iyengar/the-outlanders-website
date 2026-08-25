// memories.js - Public Memories Gallery script with batch pagination, dynamic cards, organic float motion, and fullscreen Lightbox
(function(){
  'use strict';

  const BATCH_SIZE = 15;
  let allMemories = [];
  let currentFilteredMemories = [];
  let displayedCount = BATCH_SIZE;
  let activeCategory = 'All';
  let activeLightboxIndex = 0;

  document.addEventListener('DOMContentLoaded', async () => {
    await initGallery();
  });

  async function initGallery(){
    try {
      if(window.DataAPI && typeof window.DataAPI.getMemories === 'function'){
        allMemories = await window.DataAPI.getMemories();
      } else {
        const res = await fetch('../data/memories.json');
        if(res.ok){
          const json = await res.json();
          allMemories = Array.isArray(json) ? json : json.memories || [];
        }
      }
    } catch(e){
      console.error('Failed to load memories', e);
      allMemories = [];
    }

    setupCategoryTabs();
    applyFilterAndRender(true);
    setupLightbox();

    window.addEventListener('cms-data-updated', async () => {
      if(window.DataAPI && typeof window.DataAPI.getMemories === 'function'){
        allMemories = await window.DataAPI.getMemories();
        applyFilterAndRender(true);
      }
    });
  }

  function setupCategoryTabs(){
    const tabsContainer = document.getElementById('categoryTabs');
    if(!tabsContainer) return;

    // Extract unique categories
    const categoriesSet = new Set();
    (allMemories || []).forEach(m => {
      if(m.category && m.category !== 'All') categoriesSet.add(m.category);
    });

    let html = '<button class="memories-tab-btn active" data-category="All">All Memories</button>';
    categoriesSet.forEach(cat => {
      html += `<button class="memories-tab-btn" data-category="${cat}">${cat}</button>`;
    });
    tabsContainer.innerHTML = html;

    tabsContainer.querySelectorAll('.memories-tab-btn').forEach(btn => {
      btn.addEventListener('click', function(){
        tabsContainer.querySelectorAll('.memories-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeCategory = this.getAttribute('data-category');
        displayedCount = BATCH_SIZE;
        applyFilterAndRender(true);
      });
    });
  }

  function applyFilterAndRender(reset = false){
    const grid = document.getElementById('galleryGrid');
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if(!grid) return;

    let items = (allMemories || []).filter(m => m.published !== false);

    if(activeCategory && activeCategory !== 'All'){
      items = items.filter(m => (m.category || '').toLowerCase() === activeCategory.toLowerCase());
    }

    // Sort order: custom order first, then created_at
    items.sort((a, b) => (a.order || 0) - (b.order || 0) || (b.created_at || 0) - (a.created_at || 0));

    currentFilteredMemories = items;

    const visibleItems = items.slice(0, displayedCount);

    if(items.length === 0){
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-camera display-3 text-muted mb-3 d-block"></i>
          <h4 class="text-white">No Photographs Available</h4>
          <p class="text-muted">New adventure photographs will be added soon.</p>
        </div>
      `;
      if(loadMoreWrapper) loadMoreWrapper.classList.add('d-none');
      return;
    }

    const floatClasses = ['float-1', 'float-2', 'float-3', 'float-4'];

    const html = visibleItems.map((mem, index) => {
      const floatClass = floatClasses[index % floatClasses.length];
      const revealDelay = (index % BATCH_SIZE) * 80;

      return `
        <div class="col reveal reveal-up" style="--reveal-delay: ${revealDelay}ms;">
          <div class="gallery-card ${floatClass}" data-index="${index}">
            <img src="${mem.image}" alt="Memory photograph" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='../images/hero/scroll-back.jpg'">
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;

    // Load More Button visibility
    if(loadMoreWrapper && loadMoreBtn){
      if(items.length > displayedCount){
        loadMoreWrapper.classList.remove('d-none');
        loadMoreBtn.onclick = function(){
          displayedCount += BATCH_SIZE;
          applyFilterAndRender(false);
        };
      } else {
        loadMoreWrapper.classList.add('d-none');
      }
    }

    observeGridReveals(grid);
    bindCardClicks();
  }

  function bindCardClicks(){
    const cards = document.querySelectorAll('.gallery-card');
    cards.forEach(card => {
      card.addEventListener('click', function(){
        const idx = parseInt(this.getAttribute('data-index'), 10);
        openLightbox(idx);
      });
    });
  }

  function observeGridReveals(parentEl){
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
      }, { threshold: 0.05, rootMargin: '0px 0px -20px' });
      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }
  }

  // Fullscreen Lightbox logic
  function setupLightbox(){
    const lightbox = document.getElementById('memoriesLightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if(!lightbox) return;

    if(closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if(prevBtn) prevBtn.addEventListener('click', showPrevPhoto);
    if(nextBtn) nextBtn.addEventListener('click', showNextPhoto);

    lightbox.addEventListener('click', (e) => {
      if(e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if(!lightbox.classList.contains('show')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') showPrevPhoto();
      if(e.key === 'ArrowRight') showNextPhoto();
    });

    // Mobile Swipe Gestures
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe(){
      if(touchEndX < touchStartX - 40) showNextPhoto();
      if(touchEndX > touchStartX + 40) showPrevPhoto();
    }
  }

  function openLightbox(index){
    const lightbox = document.getElementById('memoriesLightbox');
    if(!lightbox || currentFilteredMemories.length === 0) return;

    activeLightboxIndex = index;
    updateLightboxImage();
    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    const lightbox = document.getElementById('memoriesLightbox');
    if(!lightbox) return;
    lightbox.classList.remove('show');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showPrevPhoto(){
    if(currentFilteredMemories.length === 0) return;
    activeLightboxIndex = (activeLightboxIndex - 1 + currentFilteredMemories.length) % currentFilteredMemories.length;
    updateLightboxImage();
  }

  function showNextPhoto(){
    if(currentFilteredMemories.length === 0) return;
    activeLightboxIndex = (activeLightboxIndex + 1) % currentFilteredMemories.length;
    updateLightboxImage();
  }

  function updateLightboxImage(){
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const mem = currentFilteredMemories[activeLightboxIndex];
    if(mem && img){
      img.src = mem.image;
      if(counter) counter.textContent = `${activeLightboxIndex + 1} of ${currentFilteredMemories.length}`;
    }
  }

})();
