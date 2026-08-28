// trek-admin.js - Treks Management with Save/Delete Safety Modals and Live Supabase Integration
(function(){
  'use strict';

  function getVal(id, defaultVal = '') {
    const el = document.getElementById(id);
    return el ? el.value.trim() : defaultVal;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.requireLogin) requireLogin();

    let pendingDeleteId = null;
    const tbody = document.querySelector('#treksTable tbody');
    
    // Modals
    const deleteModalEl = document.getElementById('deleteTrekModal');
    const deleteModal = (deleteModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(deleteModalEl) : null;
    const confirmDeleteBtn = document.getElementById('confirmDeleteTrekBtn');

    const saveModalEl = document.getElementById('saveTrekModal');
    const saveModal = (saveModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(saveModalEl) : null;
    const confirmSaveBtn = document.getElementById('confirmSaveTrekBtn');
    const submitTrekBtn = document.getElementById('submitTrekBtn');
    const unsavedBadge = document.getElementById('unsavedBadge');

    if (tbody) await loadTreksTable();

    const form = document.getElementById('trekForm');
    if (form) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      await renderFormFields();
      if (id) {
        await fillForm(id);
      }

      // Track Unsaved Changes
      form.addEventListener('input', markDirty);
      form.addEventListener('change', markDirty);

      function markDirty() {
        if (unsavedBadge) unsavedBadge.classList.remove('d-none');
      }

      function clearDirty() {
        if (unsavedBadge) unsavedBadge.classList.add('d-none');
      }

      // Trigger Save Modal
      if (submitTrekBtn) {
        submitTrekBtn.addEventListener('click', () => {
          const payload = readForm();
          if (!payload.name || !payload.id || !payload.date || !payload.location) {
            alert('Please fill all required fields (Name, ID/Slug, Date, Location)');
            return;
          }
          if (saveModal) {
            saveModal.show();
          } else {
            executeSaveTrek();
          }
        });
      }

      if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
          await executeSaveTrek();
        });
      }

      async function executeSaveTrek() {
        if (confirmSaveBtn) {
          confirmSaveBtn.disabled = true;
          confirmSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }
        if (submitTrekBtn) {
          submitTrekBtn.disabled = true;
          submitTrekBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }

        try {
          await applyUploadedFiles();
          const payload = readForm();
          const params = new URLSearchParams(window.location.search);
          const id = params.get('id');

          if (id) {
            await DataAPI.updateTrek(id, payload);
            alert('Trek updated successfully!');
          } else {
            await DataAPI.createTrek(payload);
            alert('Trek created successfully!');
          }

          clearDirty();
          if (saveModal) saveModal.hide();
          window.location.href = 'treks.html';
        } catch (err) {
          console.error('Save Trek Error:', err);
          alert('Error saving trek: ' + (err.message || 'Server request failed'));
        } finally {
          if (confirmSaveBtn) {
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.innerHTML = 'SAVE CHANGES';
          }
          if (submitTrekBtn) {
            submitTrekBtn.disabled = false;
            submitTrekBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> SAVE CHANGES';
          }
        }
      }
    }

    async function loadTreksTable() {
      const tbody = document.querySelector('#treksTable tbody');
      if (!tbody) return;

      let treks = [];
      try {
        treks = await DataAPI.getTreks();
      } catch(e) {
        treks = [];
      }

      if (treks.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">
              <i class="bi bi-person-walking display-5 d-block mb-2 text-secondary"></i>
              No treks found. Click "Add New Trek" to create one.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = treks.map(t => {
        const isPublished = t.published !== false;
        const isFeatured = Boolean(t.featured);
        return `
          <tr data-id="${t.id}">
            <td>
              <div class="d-flex align-items-center gap-2">
                <img src="${t.coverImage || t.image || '../images/treks/kudremukha/cover.jpg'}" alt="" style="width: 46px; height: 34px; object-fit: cover; border-radius: 6px;" onerror="this.src='../images/treks/kudremukha/cover.jpg'">
                <div>
                  <strong style="color: #17212B; font-size: 0.95rem; display: block;">${t.name}</strong>
                  <div class="d-flex align-items-center gap-1 mt-1">
                    <span class="badge bg-light text-secondary border font-monospace">${t.category || 'Western Ghats'}</span>
                    ${isFeatured ? '<span class="badge bg-warning text-dark"><i class="bi bi-star-fill me-1"></i>Featured</span>' : ''}
                  </div>
                </div>
              </div>
            </td>
            <td><span class="fw-semibold" style="color: #1E293B;">${t.date || 'Every Friday Departure'}</span></td>
            <td><span style="color: #334155;">${t.location || ''}</span></td>
            <td><span class="badge bg-light text-secondary border font-monospace">${t.difficulty || 'Moderate'}</span></td>
            <td><strong style="color: #0F172A; font-size: 0.95rem;">₹${Number(t.price || 0).toLocaleString('en-IN')}</strong></td>
            <td>
              ${isPublished 
                ? '<span class="badge status-published"><i class="bi bi-eye-fill me-1"></i>Published</span>' 
                : '<span class="badge status-draft"><i class="bi bi-eye-slash-fill me-1"></i>Draft</span>'}
            </td>
            <td>
              <div class="btn-group btn-group-sm">
                <a class="btn btn-outline-primary" href="edit-trek.html?id=${t.id}" title="Edit Trek"><i class="bi bi-pencil"></i> Edit</a>
                <button class="btn btn-outline-secondary toggle-publish" data-id="${t.id}" data-published="${isPublished}" title="${isPublished ? 'Unpublish Trek' : 'Publish Trek'}">
                  <i class="bi ${isPublished ? 'bi-eye-slash' : 'bi-eye'}"></i>
                </button>
                <button class="btn btn-outline-danger delete-trek" data-id="${t.id}" title="Delete Trek"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Delete Handlers with Confirmation Modal
      document.querySelectorAll('.delete-trek').forEach(btn => {
        btn.addEventListener('click', function() {
          pendingDeleteId = this.getAttribute('data-id');
          if (deleteModal) {
            deleteModal.show();
          } else {
            if (confirm('Delete this trek? This action cannot be undone.')) {
              performDelete(pendingDeleteId);
            }
          }
        });
      });

      // Quick Publish/Unpublish Toggle
      document.querySelectorAll('.toggle-publish').forEach(btn => {
        btn.addEventListener('click', async function() {
          const id = this.getAttribute('data-id');
          const currentPub = this.getAttribute('data-published') === 'true';
          try {
            const trek = await DataAPI.getTrekById(id);
            if (trek) {
              trek.published = !currentPub;
              await DataAPI.updateTrek(id, trek);
              await loadTreksTable();
            }
          } catch(err) {
            alert('Failed to toggle publish status: ' + err.message);
          }
        });
      });
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async function() {
        if (!pendingDeleteId) return;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';
        try {
          await performDelete(pendingDeleteId);
          if (deleteModal) deleteModal.hide();
        } finally {
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.innerHTML = 'DELETE TREK';
          pendingDeleteId = null;
        }
      });
    }

    async function performDelete(id) {
      try {
        await DataAPI.deleteTrek(id);
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) row.remove();
        await loadTreksTable();
      } catch(err) {
        alert('Failed to delete trek: ' + err.message);
      }
    }

    async function renderFormFields() {
      const c = document.getElementById('formFields') || form;

      let categoryOptions = '<option value="Western Ghats">Western Ghats</option><option value="Weekend Trips">Weekend Trips</option><option value="Camping">Camping</option><option value="Road Trips">Road Trips</option><option value="Adventure Experiences">Adventure Experiences</option>';
      if (window.DataAPI && typeof window.DataAPI.getCategories === 'function') {
        try {
          const catList = await DataAPI.getCategories();
          if (catList && catList.length > 0) {
            categoryOptions = catList.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
          }
        } catch(e) {}
      }

      const html = `
        <div class="row">
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Trek Name*</label><input class="form-control" id="name" placeholder="e.g. Kudremukha Trek" required></div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">ID / Slug*</label><input class="form-control" id="id" placeholder="e.g. kudremukha" required></div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Category*</label>
            <select id="category" class="form-select" required>
              ${categoryOptions}
            </select>
          </div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Location*</label><input class="form-control" id="location" placeholder="e.g. Chikkamagaluru, Karnataka" required></div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Date / Schedule*</label>
            <input class="form-control" id="date" placeholder="e.g. Every Friday Departure" required>
          </div>
          <div class="col-md-4 mb-3"><label class="form-label fw-bold">Duration</label><input class="form-control" id="duration" placeholder="e.g. 2 Days / 1 Night"></div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Difficulty Level</label>
            <select id="difficulty" class="form-select">
              <option value="Easy">Easy</option>
              <option value="Easy to Moderate">Easy to Moderate</option>
              <option value="Moderate">Moderate</option>
              <option value="Moderate to Difficult">Moderate to Difficult</option>
              <option value="Challenging">Challenging</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3"><label class="form-label fw-bold">Price (₹)*</label><input id="price" class="form-control" type="number" placeholder="1999" required></div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Published Status</label>
            <select id="published" class="form-select">
              <option value="true">Published (Visible to Public)</option>
              <option value="false">Draft (Hidden from Public)</option>
            </select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Featured Trek</label>
            <select id="featured" class="form-select">
              <option value="false">No (Standard Catalog)</option>
              <option value="true">Yes (Homepage Featured)</option>
            </select>
          </div>
        </div>

        <!-- Package Inclusions Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Package Inclusions (One per line)</h6>
          <textarea id="inclusions" class="form-control" rows="4" placeholder="Professional Guide & Lead&#10;Meals & Refreshments&#10;First Aid & Safety Gear&#10;Permits & Local Entry Fees"></textarea>
          <div class="form-text text-muted small">Enter each package feature on a new line.</div>
        </div>

        <!-- Package Exclusions Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-x-circle-fill text-danger me-2"></i>Package Exclusions (One per line)</h6>
          <textarea id="exclusions" class="form-control" rows="4" placeholder="Personal expenses & GST&#10;Travel insurance&#10;Any meals or beverages not specified&#10;Emergency evacuations or medical expenses"></textarea>
          <div class="form-text text-muted small">Enter each excluded item on a new line.</div>
        </div>

        <!-- Trek Cover Image Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-image text-primary me-2"></i>Trek Cover Image</h6>
          <div class="row align-items-center">
            <div class="col-md-3">
              <div class="border rounded bg-dark p-1" style="height: 100px; overflow: hidden;">
                <img id="coverPreview" src="" alt="Trek Cover Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='../images/treks/kudremukha/cover.jpg'">
              </div>
            </div>
            <div class="col-md-9">
              <div class="mb-2">
                <label class="form-label small font-monospace">Cover Image Path / URL</label>
                <input id="coverImage" class="form-control form-control-sm" placeholder="../images/treks/kudremukha/cover.jpg">
              </div>
              <div>
                <label class="form-label small font-monospace">Or Upload New Cover Image File</label>
                <input id="coverFile" type="file" accept="image/*" class="form-control form-control-sm">
              </div>
            </div>
          </div>
        </div>

        <!-- Itinerary PDF Attachment Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Itinerary PDF Document / Text</h6>
          <div class="row align-items-center mb-2">
            <div class="col-md-3">
              <div class="border rounded bg-white p-2 text-center">
                <i class="bi bi-file-pdf display-5 text-danger d-block"></i>
                <span id="itineraryStatus" class="small fw-bold text-truncate d-block mt-1">No PDF Attached</span>
              </div>
            </div>
            <div class="col-md-9">
              <div class="mb-2">
                <label class="form-label small font-monospace">Itinerary File Path / URL or Text</label>
                <input id="itinerary" class="form-control form-control-sm" placeholder="../assets/documents/Kudremukha.pdf">
              </div>
              <div>
                <label class="form-label small font-monospace">Or Upload New Itinerary PDF File</label>
                <input id="itineraryFile" type="file" accept=".pdf,.doc,.docx" class="form-control form-control-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3"><label class="form-label fw-bold">Short Description (Summary Card)</label><textarea id="shortDescription" class="form-control" rows="2" placeholder="Brief summary displayed on trek card"></textarea></div>
        <div class="mb-3"><label class="form-label fw-bold">Full Detailed Description</label><textarea id="description" class="form-control" rows="4" placeholder="Comprehensive itinerary or trek details"></textarea></div>
      `;
      c.innerHTML = html;

      const coverInput = document.getElementById('coverImage');
      const coverFile = document.getElementById('coverFile');
      const coverPrev = document.getElementById('coverPreview');

      const itineraryInput = document.getElementById('itinerary');
      const itineraryFile = document.getElementById('itineraryFile');
      const itineraryStatus = document.getElementById('itineraryStatus');

      if (coverInput && coverPrev) {
        coverInput.addEventListener('input', () => coverPrev.src = coverInput.value);
      }
      if (coverFile && coverPrev) {
        coverFile.addEventListener('change', async () => {
          if (coverFile.files && coverFile.files[0]) {
            const file = coverFile.files[0];
            try {
              const res = await DataAPI.uploadFile(file, 'treks');
              const imgUrl = res.url || res.fullUrl;
              if (document.getElementById('coverImage')) document.getElementById('coverImage').value = imgUrl;
              coverPrev.src = imgUrl;
            } catch(e) {
              const dataUrl = await fileToDataURL(file);
              if (document.getElementById('coverImage')) document.getElementById('coverImage').value = dataUrl;
              coverPrev.src = dataUrl;
            }
          }
        });
      }

      if (itineraryInput && itineraryStatus) {
        itineraryInput.addEventListener('input', () => {
          const val = itineraryInput.value;
          itineraryStatus.textContent = val ? (val.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
          itineraryStatus.className = val ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
        });
      }
      if (itineraryFile && itineraryStatus) {
        itineraryFile.addEventListener('change', async () => {
          if (itineraryFile.files && itineraryFile.files[0]) {
            const file = itineraryFile.files[0];
            if (itineraryStatus) {
              itineraryStatus.textContent = 'Uploading...';
              itineraryStatus.className = 'small fw-bold text-warning text-truncate d-block mt-1';
            }
            try {
              const res = await DataAPI.uploadFile(file);
              const fileUrl = res.url || res.fullUrl;
              if (document.getElementById('itinerary')) document.getElementById('itinerary').value = fileUrl;
              if (itineraryStatus) {
                itineraryStatus.textContent = file.name.substring(0, 18) + ' (Uploaded)';
                itineraryStatus.className = 'small fw-bold text-success text-truncate d-block mt-1';
              }
            } catch(err) {
              console.warn('PDF upload fallback to dataURL:', err);
              const dataUrl = await fileToDataURL(file);
              if (document.getElementById('itinerary')) document.getElementById('itinerary').value = dataUrl;
              if (itineraryStatus) {
                itineraryStatus.textContent = file.name.substring(0, 18) + ' (Ready)';
                itineraryStatus.className = 'small fw-bold text-success text-truncate d-block mt-1';
              }
            }
          }
        });
      }
    }

    async function fillForm(id) {
      const trek = await DataAPI.getTrekById(id);
      if (!trek) return alert('Trek not found');
      if (document.getElementById('id')) document.getElementById('id').value = trek.id || '';
      if (document.getElementById('name')) document.getElementById('name').value = trek.name || '';
      if (document.getElementById('category')) document.getElementById('category').value = trek.category || 'Western Ghats';
      if (document.getElementById('location')) document.getElementById('location').value = trek.location || '';
      if (document.getElementById('date')) document.getElementById('date').value = trek.date || 'Every Friday Departure';
      if (document.getElementById('duration')) document.getElementById('duration').value = trek.duration || '';

      if (document.getElementById('difficulty')) {
        const diffVal = trek.difficulty || 'Moderate';
        const selectEl = document.getElementById('difficulty');
        const match = Array.from(selectEl.options).find(o => o.value.toLowerCase() === diffVal.toLowerCase());
        if (match) {
          selectEl.value = match.value;
        } else {
          const newOpt = new Option(diffVal, diffVal, true, true);
          selectEl.add(newOpt);
        }
      }

      const defaultInclusions = "Professional Guide & Lead\nMeals & Refreshments\nFirst Aid & Safety Gear\nPermits & Local Entry Fees";
      let incVal = trek.inclusions;
      if (Array.isArray(incVal)) incVal = incVal.join('\n');
      if (document.getElementById('inclusions')) document.getElementById('inclusions').value = incVal || defaultInclusions;

      const defaultExclusions = "Personal expenses & GST\nTravel insurance\nAny meals or beverages not specified\nEmergency evacuations or medical expenses";
      let excVal = trek.exclusions;
      if (Array.isArray(excVal)) excVal = excVal.join('\n');
      if (document.getElementById('exclusions')) document.getElementById('exclusions').value = excVal || defaultExclusions;

      if (document.getElementById('price')) document.getElementById('price').value = trek.price || '';
      if (document.getElementById('published')) document.getElementById('published').value = trek.published !== false ? 'true' : 'false';
      if (document.getElementById('featured')) document.getElementById('featured').value = trek.featured ? 'true' : 'false';
      if (document.getElementById('shortDescription')) document.getElementById('shortDescription').value = trek.shortDescription || '';
      if (document.getElementById('description')) document.getElementById('description').value = trek.description || '';

      const coverVal = trek.coverImage || trek.image || '';
      if (document.getElementById('coverImage')) document.getElementById('coverImage').value = coverVal;
      const coverPrev = document.getElementById('coverPreview');
      if (coverPrev) coverPrev.src = coverVal || '../images/treks/kudremukha/cover.jpg';

      const itinVal = trek.itinerary || '';
      if (document.getElementById('itinerary')) document.getElementById('itinerary').value = itinVal;
      const itinStatus = document.getElementById('itineraryStatus');
      if (itinStatus) {
        itinStatus.textContent = itinVal ? (itinVal.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
        itinStatus.className = itinVal ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
      }
    }

    function readForm() {
      const titleVal = getVal('name') || getVal('title');
      const rawInc = getVal('inclusions');
      const incList = rawInc ? rawInc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const rawExc = getVal('exclusions');
      const excList = rawExc ? rawExc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const idVal = getVal('id') || (titleVal ? titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');

      return {
        id: idVal,
        name: titleVal,
        category: getVal('category', 'Western Ghats'),
        location: getVal('location'),
        date: getVal('date', 'Every Friday Departure'),
        duration: getVal('duration'),
        difficulty: getVal('difficulty', 'Moderate'),
        price: Number(getVal('price')) || 0,
        inclusions: incList.length > 0 ? incList : ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
        exclusions: excList.length > 0 ? excList : ['Personal expenses & GST', 'Travel insurance', 'Any meals or beverages not specified', 'Emergency evacuations or medical expenses'],
        shortDescription: getVal('shortDescription'),
        description: getVal('description'),
        coverImage: getVal('coverImage'),
        image: getVal('coverImage'),
        itinerary: getVal('itinerary'),
        published: getVal('published', 'true') === 'true',
        featured: getVal('featured', 'false') === 'true'
      };
    }
    
    async function applyUploadedFiles() {
      const coverInput = document.getElementById('coverFile');
      if (coverInput && coverInput.files && coverInput.files[0]) {
        try {
          const res = await DataAPI.uploadFile(coverInput.files[0]);
          if (res && (res.url || res.fullUrl)) {
            if (document.getElementById('coverImage')) document.getElementById('coverImage').value = res.url || res.fullUrl;
          } else {
            if (document.getElementById('coverImage')) document.getElementById('coverImage').value = await fileToDataURL(coverInput.files[0]);
          }
        } catch(e) {
          if (document.getElementById('coverImage')) document.getElementById('coverImage').value = await fileToDataURL(coverInput.files[0]);
        }
      }

      const itineraryInput = document.getElementById('itineraryFile');
      if (itineraryInput && itineraryInput.files && itineraryInput.files[0]) {
        try {
          const res = await DataAPI.uploadFile(itineraryInput.files[0]);
          if (res && (res.url || res.fullUrl)) {
            if (document.getElementById('itinerary')) document.getElementById('itinerary').value = res.url || res.fullUrl;
          } else {
            if (document.getElementById('itinerary')) document.getElementById('itinerary').value = await fileToDataURL(itineraryInput.files[0]);
          }
        } catch(e) {
          if (document.getElementById('itinerary')) document.getElementById('itinerary').value = await fileToDataURL(itineraryInput.files[0]);
        }
      }
    }

    function fileToDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

  });
})();
