// memories-admin.js - Admin manager for Memories Gallery with safe draft state & modal confirmation
(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if(window.requireLogin) requireLogin();

    let publishedMemories = [];
    let workingMemories = [];
    let categoriesList = [];
    let hasUnsavedChanges = false;

    const grid = document.getElementById('memoriesGrid');
    const totalBadge = document.getElementById('totalCountBadge');
    const draftBadge = document.getElementById('draftStatusBadge');
    const triggerBtn = document.getElementById('triggerMultiUploadBtn');
    const fileInput = document.getElementById('multiFileInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortOrderSelect');
    const saveBtn = document.getElementById('saveMemoriesBtn');
    const removeAllBtn = document.getElementById('removeAllBtn');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const saveModalEl = document.getElementById('saveMemoriesModal');
    let saveModal = saveModalEl ? new bootstrap.Modal(saveModalEl) : null;

    // Load Categories & Initial Memories
    try {
      categoriesList = await DataAPI.getCategories();
      populateCategoryFilter();
    } catch(e){}

    await loadMemories();

    async function loadMemories(){
      publishedMemories = await DataAPI.getMemories();
      workingMemories = JSON.parse(JSON.stringify(publishedMemories));
      hasUnsavedChanges = false;
      updateDraftStatus();
      renderGrid();
    }

    function populateCategoryFilter(){
      if(!categoryFilter) return;
      let html = '<option value="All">All Categories</option>';
      if(categoriesList && categoriesList.length > 0){
        html += categoriesList.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      } else {
        html += '<option value="Western Ghats">Western Ghats</option><option value="Camping">Camping</option><option value="Road Trips">Road Trips</option>';
      }
      categoryFilter.innerHTML = html;
    }

    function updateDraftStatus(){
      if(!draftBadge) return;
      if(hasUnsavedChanges){
        draftBadge.className = 'draft-badge has-changes';
        draftBadge.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> ● UNSAVED CHANGES';
      } else {
        draftBadge.className = 'draft-badge synced';
        draftBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i> ALL CHANGES PUBLISHED';
      }
    }

    function markDirty(){
      hasUnsavedChanges = true;
      updateDraftStatus();
    }

    // Render Preview Grid
    function renderGrid(){
      if(!grid) return;
      const catVal = categoryFilter ? categoryFilter.value : 'All';
      const sortVal = sortSelect ? sortSelect.value : 'custom';

      let items = [...workingMemories];

      if(catVal && catVal !== 'All'){
        items = items.filter(m => (m.category || '').toLowerCase() === catVal.toLowerCase());
      }

      if(sortVal === 'newest'){
        items.sort((a,b) => (b.created_at || 0) - (a.created_at || 0));
      } else if(sortVal === 'oldest'){
        items.sort((a,b) => (a.created_at || 0) - (b.created_at || 0));
      } else {
        items.sort((a,b) => (a.order || 0) - (b.order || 0));
      }

      if(totalBadge) totalBadge.textContent = `Total Memories: ${workingMemories.length}`;

      if(items.length === 0){
        grid.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-images display-3 text-muted mb-3 d-block"></i>
            <h5 class="text-secondary">No Photographs Found</h5>
            <p class="small text-muted mb-3">Click "Upload Memories" to add photographs to your gallery wall.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map((mem, index) => {
        const catSelectHTML = `
          <select class="form-select form-select-sm cat-select mt-1" data-id="${mem.id}" style="font-size: 0.75rem;">
            <option value="All" ${mem.category === 'All' ? 'selected' : ''}>General / All</option>
            ${categoriesList.map(c => `<option value="${c.name}" ${mem.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        `;

        return `
          <div class="col" data-id="${mem.id}">
            <div class="memory-thumb-card">
              <div class="memory-thumb-img-wrapper">
                <img src="${mem.image}" alt="Memory" loading="lazy" onerror="this.src='../images/hero/scroll-back.jpg'">
                <span class="badge bg-dark position-absolute top-0 start-0 m-2 font-monospace opacity-75">#${index + 1}</span>
              </div>
              <div class="memory-thumb-actions">
                <label class="form-label mb-0" style="font-size: 0.7rem; color: #64748B;">Category Label</label>
                ${catSelectHTML}
                <div class="d-flex justify-content-between align-items-center mt-2 gap-1">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary btn-move-left" data-id="${mem.id}" title="Move Left / Earlier" ${index === 0 ? 'disabled' : ''}><i class="bi bi-arrow-left"></i></button>
                    <button class="btn btn-outline-secondary btn-move-right" data-id="${mem.id}" title="Move Right / Later" ${index === items.length - 1 ? 'disabled' : ''}><i class="bi bi-arrow-right"></i></button>
                  </div>
                  <button class="btn btn-sm btn-outline-danger btn-delete-mem" data-id="${mem.id}" title="Delete Photo"><i class="bi bi-trash"></i> Delete</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      bindCardEvents();
    }

    function bindCardEvents(){
      // Delete single item
      grid.querySelectorAll('.btn-delete-mem').forEach(btn => {
        btn.addEventListener('click', function(){
          const id = this.getAttribute('data-id');
          workingMemories = workingMemories.filter(m => m.id !== id);
          markDirty();
          renderGrid();
        });
      });

      // Category change
      grid.querySelectorAll('.cat-select').forEach(sel => {
        sel.addEventListener('change', function(){
          const id = this.getAttribute('data-id');
          const mem = workingMemories.find(m => m.id === id);
          if(mem){
            mem.category = this.value;
            markDirty();
          }
        });
      });

      // Move left
      grid.querySelectorAll('.btn-move-left').forEach(btn => {
        btn.addEventListener('click', function(){
          const id = this.getAttribute('data-id');
          const idx = workingMemories.findIndex(m => m.id === id);
          if(idx > 0){
            const temp = workingMemories[idx];
            workingMemories[idx] = workingMemories[idx - 1];
            workingMemories[idx - 1] = temp;
            workingMemories.forEach((m, i) => m.order = i + 1);
            markDirty();
            renderGrid();
          }
        });
      });

      // Move right
      grid.querySelectorAll('.btn-move-right').forEach(btn => {
        btn.addEventListener('click', function(){
          const id = this.getAttribute('data-id');
          const idx = workingMemories.findIndex(m => m.id === id);
          if(idx !== -1 && idx < workingMemories.length - 1){
            const temp = workingMemories[idx];
            workingMemories[idx] = workingMemories[idx + 1];
            workingMemories[idx + 1] = temp;
            workingMemories.forEach((m, i) => m.order = i + 1);
            markDirty();
            renderGrid();
          }
        });
      });
    }

    // Multi File Upload Handler with Auto Canvas Compression
    if(triggerBtn && fileInput){
      triggerBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async function(){
        const files = Array.from(this.files || []);
        if(files.length === 0) return;

        triggerBtn.disabled = true;
        triggerBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Processing ${files.length} photos...`;

        for(let i = 0; i < files.length; i++){
          try {
            const dataUrl = await fileToDataURL(files[i]);
            workingMemories.unshift({
              id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              image: dataUrl,
              category: categoryFilter ? (categoryFilter.value !== 'All' ? categoryFilter.value : 'Western Ghats') : 'Western Ghats',
              order: workingMemories.length + 1,
              created_at: Date.now() + i,
              published: true
            });
          } catch(e){
            console.error('File conversion error', e);
          }
        }

        workingMemories.forEach((m, i) => m.order = i + 1);
        markDirty();
        renderGrid();

        fileInput.value = '';
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = '<i class="bi bi-plus-lg me-1"></i> UPLOAD MEMORIES';
      });
    }

    // Lightweight Canvas Auto-Compressor (800px max, 0.72 quality ~35KB per image)
    function fileToDataURL(file, maxWidth = 800, maxHeight = 800, quality = 0.72){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = () => resolve(e.target.result);
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Filter and Sort events
    if(categoryFilter) categoryFilter.addEventListener('change', () => renderGrid());
    if(sortSelect) sortSelect.addEventListener('change', () => renderGrid());

    if(removeAllBtn){
      removeAllBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to delete all photos from the working draft?')){
          workingMemories = [];
          markDirty();
          renderGrid();
        }
      });
    }

    // Save Memories Confirmation Modal Handler
    if(saveBtn){
      saveBtn.addEventListener('click', () => {
        if(saveModal) saveModal.show();
      });
    }

    if(confirmSaveBtn){
      confirmSaveBtn.addEventListener('click', async function(){
        confirmSaveBtn.disabled = true;
        confirmSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Publishing...';

        try {
          publishedMemories = await DataAPI.updateMemories(workingMemories);
          hasUnsavedChanges = false;
          updateDraftStatus();
          if(saveModal) saveModal.hide();
          alert('Memories Gallery updated and published successfully!');
        } catch(err) {
          alert('Failed to save memories: ' + err.message);
        } finally {
          confirmSaveBtn.disabled = false;
          confirmSaveBtn.innerHTML = 'SAVE CHANGES';
        }
      });
    }

    // Toggle sidebar on mobile
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if(toggleBtn && sidebar){
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('show'));
    }

  });
})();
