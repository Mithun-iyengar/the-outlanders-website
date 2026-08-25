// filters.js — client-side filtering for treks.html and trips.html with dynamic CMS category dropdowns
(function(){
  'use strict';

  async function loadAndFilter(){
    const isTripsPage = !!document.getElementById('trip-list');
    const container = document.getElementById(isTripsPage ? 'trip-list' : 'trek-list');
    if(!container) return;

    let items = [];
    if(isTripsPage){
      if(window.DataAPI && typeof window.DataAPI.getTrips === 'function'){
        items = await window.DataAPI.getTrips();
      } else {
        try {
          const res = await fetch('../data/trips.json');
          const json = await res.json();
          items = Array.isArray(json) ? json : json.trips || [];
        } catch(e) { console.error('Failed to load trips', e); }
      }
    } else {
      if(window.DataAPI && typeof window.DataAPI.getTreks === 'function'){
        items = await window.DataAPI.getTreks();
      } else {
        try {
          const res = await fetch('../data/treks.json');
          const json = await res.json();
          items = Array.isArray(json) ? json : json.treks || [];
        } catch(e) { console.error('Failed to load treks', e); }
      }
    }

    const categorySelect = document.getElementById('filter-category');
    const difficultySelect = document.getElementById('filter-difficulty');
    const durationSelect = document.getElementById('filter-duration');
    const searchInput = document.getElementById('searchBox');

    // Dynamically populate Category dropdown options from DataAPI if available
    if(categorySelect && window.DataAPI && typeof window.DataAPI.getCategories === 'function'){
      try {
        const catList = await window.DataAPI.getCategories();
        const activeCats = (catList || []).filter(c => c.published !== false).sort((a,b) => (a.order||0) - (b.order||0));
        
        if(activeCats.length > 0){
          const optionsHTML = `<option value="All">All Categories</option>` + activeCats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
          categorySelect.innerHTML = optionsHTML;
        }
      } catch(e) {
        console.error('Failed to populate CMS categories', e);
      }
    }

    // Parse URL Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    const urlDifficulty = urlParams.get('difficulty');
    const urlDuration = urlParams.get('duration');
    const urlQuery = urlParams.get('q') || urlParams.get('search');

    if(urlCategory && categorySelect){
      const optionsArray = Array.from(categorySelect.options);
      const match = optionsArray.find(opt => 
        opt.value.toLowerCase() === urlCategory.toLowerCase() ||
        urlCategory.toLowerCase().includes(opt.value.toLowerCase()) ||
        opt.value.toLowerCase().includes(urlCategory.toLowerCase())
      );
      if(match){
        categorySelect.value = match.value;
      }
    }

    if(urlDifficulty && difficultySelect){
      const match = Array.from(difficultySelect.options).find(opt => opt.value.toLowerCase() === urlDifficulty.toLowerCase());
      if(match) difficultySelect.value = match.value;
    }

    if(urlDuration && durationSelect){
      const match = Array.from(durationSelect.options).find(opt => opt.value.toLowerCase() === urlDuration.toLowerCase());
      if(match) durationSelect.value = match.value;
    }

    if(urlQuery && searchInput){
      searchInput.value = urlQuery;
    }

    function applyFilters(){
      const cat = categorySelect ? categorySelect.value : 'All';
      const diff = difficultySelect ? difficultySelect.value : 'All';
      const dur = durationSelect ? durationSelect.value : 'All';
      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';

      let list = items.filter(t => t.published !== false);

      if(cat && cat !== 'All'){
        list = list.filter(t => 
          (t.category && t.category.toLowerCase().includes(cat.toLowerCase())) ||
          (t.location && t.location.toLowerCase().includes(cat.toLowerCase())) ||
          (t.name && t.name.toLowerCase().includes(cat.toLowerCase()))
        );
      }

      if(diff && diff !== 'All'){
        list = list.filter(t => t.difficulty && t.difficulty.toLowerCase() === diff.toLowerCase());
      }

      if(dur && dur !== 'All'){
        list = list.filter(t => t.duration && t.duration.toLowerCase().includes(dur.toLowerCase()));
      }

      if(q){
        list = list.filter(t => 
          (t.name + ' ' + (t.location||'') + ' ' + (t.category||'') + ' ' + (t.shortDescription||'')).toLowerCase().includes(q)
        );
      }

      if(list.length === 0){
        const labelText = isTripsPage ? 'trips' : 'treks';
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-search display-4 text-muted mb-3 d-block"></i>
            <h4 class="text-white">No ${labelText} found matching your filter</h4>
            <p class="text-muted">Try clearing your search or selecting a different category.</p>
            <button class="btn btn-outline-light btn-sm mt-2" id="reset-filters-btn">Reset Filters</button>
          </div>
        `;
        const resetBtn = document.getElementById('reset-filters-btn');
        if(resetBtn){
          resetBtn.addEventListener('click', function(){
            if(categorySelect) categorySelect.value = 'All';
            if(difficultySelect) difficultySelect.value = 'All';
            if(durationSelect) durationSelect.value = 'All';
            if(searchInput) searchInput.value = '';
            applyFilters();
          });
        }
        return;
      }

      if(window.Treks && typeof window.Treks.renderTrekCard === 'function'){
        container.innerHTML = list.map((t, index) => window.Treks.renderTrekCard(Object.assign({}, t, { id: t.slug || t.id }), index)).join('');
      } else {
        container.innerHTML = list.map(t => `<div class="col-12 col-md-6 col-lg-4"><pre>${JSON.stringify(t, null, 2)}</pre></div>`).join('');
      }

      // Trigger reveal observer on newly filtered nodes
      if(window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if(entry.isIntersecting){
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
      } else {
        container.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      }
    }

    if(categorySelect) categorySelect.addEventListener('change', applyFilters);
    if(difficultySelect) difficultySelect.addEventListener('change', applyFilters);
    if(durationSelect) durationSelect.addEventListener('change', applyFilters);
    if(searchInput) searchInput.addEventListener('input', applyFilters);

    window.addEventListener('cms-data-updated', () => {
      loadAndFilter();
    });

    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', loadAndFilter);
})();
