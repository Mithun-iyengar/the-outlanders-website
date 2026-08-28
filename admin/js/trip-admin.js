// trip-admin.js - Trips Management with Save/Delete Safety Modals and Live Data Integration
(function(){
  'use strict';

  function getVal(id, defaultVal = '') {
    const el = document.getElementById(id);
    return el ? el.value.trim() : defaultVal;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.requireLogin) requireLogin();

    let pendingDeleteId = null;
    const tbody = document.querySelector('#tripsTable tbody');

    // Modals
    const deleteModalEl = document.getElementById('deleteTripModal');
    const deleteModal = (deleteModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(deleteModalEl) : null;
    const confirmDeleteBtn = document.getElementById('confirmDeleteTripBtn');

    const saveModalEl = document.getElementById('saveTripModal');
    const saveModal = (saveModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(saveModalEl) : null;
    const confirmSaveBtn = document.getElementById('confirmSaveTripBtn');
    const submitTripBtn = document.getElementById('submitTripBtn');
    const unsavedBadge = document.getElementById('unsavedBadge');

    if (tbody) await loadTripsTable();

    const form = document.getElementById('tripForm');
    if (form) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      await renderFormFields();
      if (id) {
        await fillForm(id);
      }

      form.addEventListener('input', markDirty);
      form.addEventListener('change', markDirty);

      function markDirty() {
        if (unsavedBadge) unsavedBadge.classList.remove('d-none');
      }

      function clearDirty() {
        if (unsavedBadge) unsavedBadge.classList.add('d-none');
      }

      if (submitTripBtn) {
        submitTripBtn.addEventListener('click', () => {
          const payload = readForm();
          const titleVal = payload.name || payload.title;
          if (!titleVal || !payload.id) {
            alert('Please fill in required fields (Title and ID/Slug)');
            return;
          }
          if (saveModal) {
            saveModal.show();
          } else {
            executeSaveTrip();
          }
        });
      }

      if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
          await executeSaveTrip();
        });
      }

      async function executeSaveTrip() {
        if (confirmSaveBtn) {
          confirmSaveBtn.disabled = true;
          confirmSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }
        if (submitTripBtn) {
          submitTripBtn.disabled = true;
          submitTripBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }

        try {
          await applyUploadedFiles();
          const payload = readForm();
          const params = new URLSearchParams(window.location.search);
          const id = params.get('id');

          if (id) {
            await DataAPI.updateTrip(id, payload);
            alert('Trip updated successfully!');
          } else {
            await DataAPI.createTrip(payload);
            alert('Trip created successfully!');
          }

          clearDirty();
          if (saveModal) saveModal.hide();
          window.location.href = 'trips.html';
        } catch (err) {
          console.error('Save Trip Error:', err);
          alert('Error saving trip: ' + (err.message || 'Server request failed'));
        } finally {
          if (confirmSaveBtn) {
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.innerHTML = 'SAVE CHANGES';
          }
          if (submitTripBtn) {
            submitTripBtn.disabled = false;
            submitTripBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> SAVE CHANGES';
          }
        }
      }
    }

    async function loadTripsTable() {
      const tbody = document.querySelector('#tripsTable tbody');
      if (!tbody) return;

      let trips = [];
      try {
        trips = await DataAPI.getTrips();
      } catch(e) {
        trips = [];
      }

      if (trips.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-4 text-muted">
              <i class="bi bi-map display-5 d-block mb-2 text-secondary"></i>
              No trips found. Click "Add New Trip" to create one.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = trips.map(t => {
        const isPublished = t.published !== false;
        return `
          <tr data-id="${t.id}">
            <td>
              <div class="d-flex align-items-center gap-2">
                <img src="${t.coverImage || t.image || '../images/trips/roadtrip-card.jpg'}" alt="" style="width: 46px; height: 34px; object-fit: cover; border-radius: 6px;" onerror="this.src='../images/trips/roadtrip-card.jpg'">
                <div>
                  <strong style="color: #17212B; font-size: 0.95rem; display: block;">${t.name || t.title}</strong>
                  <span class="badge bg-light text-secondary border font-monospace mt-1">${t.category || 'Weekend Trips'}</span>
                </div>
              </div>
            </td>
            <td><span class="badge bg-light text-dark border font-monospace">${t.duration || '2 Days'}</span></td>
            <td><span class="fw-semibold" style="color: #1E293B;">${t.date || 'Every Friday Departure'}</span></td>
            <td><span style="color: #334155;">${t.location || ''}</span></td>
            <td><span class="badge bg-light text-secondary border font-monospace">${t.difficulty || 'Easy'}</span></td>
            <td><strong style="color: #0F172A; font-size: 0.95rem;">₹${Number(t.price || 0).toLocaleString('en-IN')}</strong></td>
            <td>
              ${isPublished 
                ? '<span class="badge status-published"><i class="bi bi-eye-fill me-1"></i>Published</span>' 
                : '<span class="badge status-draft"><i class="bi bi-eye-slash-fill me-1"></i>Draft</span>'}
            </td>
            <td>
              <div class="btn-group btn-group-sm">
                <a class="btn btn-outline-primary" href="edit-trip.html?id=${t.id}" title="Edit Trip"><i class="bi bi-pencil"></i> Edit</a>
                <button class="btn btn-outline-secondary toggle-publish" data-id="${t.id}" data-published="${isPublished}" title="${isPublished ? 'Unpublish Trip' : 'Publish Trip'}">
                  <i class="bi ${isPublished ? 'bi-eye-slash' : 'bi-eye'}"></i>
                </button>
                <button class="btn btn-outline-danger delete-trip" data-id="${t.id}" title="Delete Trip"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.delete-trip').forEach(btn => {
        btn.addEventListener('click', function() {
          pendingDeleteId = this.getAttribute('data-id');
          if (deleteModal) {
            deleteModal.show();
          } else {
            if (confirm('Delete this trip? This action cannot be undone.')) {
              performDelete(pendingDeleteId);
            }
          }
        });
      });

      document.querySelectorAll('.toggle-publish').forEach(btn => {
        btn.addEventListener('click', async function() {
          const id = this.getAttribute('data-id');
          const currentPub = this.getAttribute('data-published') === 'true';
          try {
            const trip = await DataAPI.getTripById(id);
            if (trip) {
              trip.published = !currentPub;
              await DataAPI.updateTrip(id, trip);
              await loadTripsTable();
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
          confirmDeleteBtn.innerHTML = 'DELETE TRIP';
          pendingDeleteId = null;
        }
      });
    }

    async function performDelete(id) {
      try {
        await DataAPI.deleteTrip(id);
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) row.remove();
        await loadTripsTable();
      } catch(err) {
        alert('Failed to delete trip: ' + err.message);
      }
    }

    async function renderFormFields() {
      const c = document.getElementById('formFields') || form;

      let categoryOptions = '<option value="Weekend Trips">Weekend Trips</option><option value="Road Trips">Road Trips</option><option value="Camping">Camping</option><option value="Western Ghats">Western Ghats</option><option value="Adventure Experiences">Adventure Experiences</option>';
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
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Trip Title*</label><input class="form-control" id="title" placeholder="e.g. Gokarna Getaway" required></div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">ID / Slug*</label><input class="form-control" id="id" placeholder="e.g. gokarna-getaway" required></div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Category*</label>
            <select id="category" class="form-select" required>
              ${categoryOptions}
            </select>
          </div>
          <div class="col-md-6 mb-3"><label class="form-label">Location</label><input class="form-control" id="location" placeholder="e.g. Gokarna, Karnataka"></div>
        </div>
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Date / Schedule*</label>
            <input class="form-control" id="date" placeholder="e.g. Every Friday Departure" required>
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Duration*</label>
            <input class="form-control" id="duration" placeholder="e.g. 2 Days / 1 Night" required>
          </div>
          <div class="col-md-3 mb-3"><label class="form-label fw-bold">Price (₹)</label><input id="price" class="form-control" type="number" placeholder="2499"></div>
          <div class="col-md-3 mb-3">
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
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Published Status</label>
            <select id="published" class="form-select">
              <option value="true">Published (Visible to Public)</option>
              <option value="false">Draft (Hidden from Public)</option>
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

        <!-- Trip Cover Image Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-image text-primary me-2"></i>Trip Cover Image</h6>
          <div class="row align-items-center">
            <div class="col-md-3">
              <div class="border rounded bg-dark p-1" style="height: 100px; overflow: hidden;">
                <img id="coverPreview" src="" alt="Trip Cover Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='../images/trips/roadtrip-card.jpg'">
              </div>
            </div>
            <div class="col-md-9">
              <div class="mb-2">
                <label class="form-label small font-monospace">Cover Image Path / URL</label>
                <input id="coverImage" class="form-control form-control-sm" placeholder="../images/trips/gokarna/cover.jpg">
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
                <input id="itinerary" class="form-control form-control-sm" placeholder="../assets/documents/Gokarna.pdf">
              </div>
              <div>
                <label class="form-label small font-monospace">Or Upload New Itinerary PDF File</label>
                <input id="itineraryFile" type="file" accept=".pdf,.doc,.docx" class="form-control form-control-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3"><label class="form-label fw-bold">Short Description</label><textarea id="shortDescription" class="form-control" rows="3" placeholder="Brief description of trip"></textarea></div>
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
              const res = await DataAPI.uploadFile(file, 'trips');
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
      const trip = await DataAPI.getTripById(id);
      if (!trip) return alert('Trip not found');
      if (document.getElementById('id')) document.getElementById('id').value = trip.id || '';
      if (document.getElementById('title')) document.getElementById('title').value = trip.name || trip.title || '';
      if (document.getElementById('date')) document.getElementById('date').value = trip.date || 'Every Friday Departure';
      if (document.getElementById('duration')) document.getElementById('duration').value = trip.duration || '2 Days / 1 Night';
      if (document.getElementById('location')) document.getElementById('location').value = trip.location || '';
      if (document.getElementById('price')) document.getElementById('price').value = trip.price || '';

      const catSelect = document.getElementById('category');
      if (catSelect && trip.category) {
        const catMatch = Array.from(catSelect.options).find(o => o.value.toLowerCase() === trip.category.toLowerCase());
        if (catMatch) {
          catSelect.value = catMatch.value;
        } else {
          const newOpt = new Option(trip.category, trip.category, true, true);
          catSelect.add(newOpt);
        }
      }

      const diffSelect = document.getElementById('difficulty');
      if (diffSelect) {
        const diffVal = trip.difficulty || 'Easy';
        const diffMatch = Array.from(diffSelect.options).find(o => o.value.toLowerCase() === diffVal.toLowerCase());
        if (diffMatch) {
          diffSelect.value = diffMatch.value;
        } else {
          const newOpt = new Option(diffVal, diffVal, true, true);
          diffSelect.add(newOpt);
        }
      }

      const defaultInclusions = "Professional Guide & Lead\nMeals & Refreshments\nFirst Aid & Safety Gear\nPermits & Local Entry Fees";
      let incVal = trip.inclusions;
      if (Array.isArray(incVal)) incVal = incVal.join('\n');
      if (document.getElementById('inclusions')) document.getElementById('inclusions').value = incVal || defaultInclusions;

      const defaultExclusions = "Personal expenses & GST\nTravel insurance\nAny meals or beverages not specified\nEmergency evacuations or medical expenses";
      let excVal = trip.exclusions;
      if (Array.isArray(excVal)) excVal = excVal.join('\n');
      if (document.getElementById('exclusions')) document.getElementById('exclusions').value = excVal || defaultExclusions;

      const imgVal = trip.coverImage || trip.image || '';
      if (document.getElementById('coverImage')) document.getElementById('coverImage').value = imgVal;

      const coverPrev = document.getElementById('coverPreview');
      if (coverPrev) coverPrev.src = imgVal || '../images/trips/roadtrip-card.jpg';

      const itinVal = trip.itinerary || '';
      if (document.getElementById('itinerary')) document.getElementById('itinerary').value = itinVal;
      const itinStatus = document.getElementById('itineraryStatus');
      if (itinStatus) {
        itinStatus.textContent = itinVal ? (itinVal.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
        itinStatus.className = itinVal ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
      }

      if (document.getElementById('shortDescription')) document.getElementById('shortDescription').value = trip.shortDescription || trip.description || '';
      if (document.getElementById('published')) document.getElementById('published').value = trip.published !== false ? 'true' : 'false';
    }

    function readForm() {
      const titleVal = getVal('title') || getVal('name');
      const rawInc = getVal('inclusions');
      const incList = rawInc ? rawInc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const rawExc = getVal('exclusions');
      const excList = rawExc ? rawExc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const idVal = getVal('id') || (titleVal ? titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');

      return {
        id: idVal,
        name: titleVal,
        title: titleVal,
        category: getVal('category', 'Weekend Trips'),
        date: getVal('date', 'Every Friday Departure'),
        duration: getVal('duration', '2 Days / 1 Night'),
        location: getVal('location'),
        price: Number(getVal('price')) || 0,
        difficulty: getVal('difficulty', 'Easy'),
        inclusions: incList.length > 0 ? incList : ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
        exclusions: excList.length > 0 ? excList : ['Personal expenses & GST', 'Travel insurance', 'Any meals or beverages not specified', 'Emergency evacuations or medical expenses'],
        coverImage: getVal('coverImage'),
        image: getVal('coverImage'),
        itinerary: getVal('itinerary'),
        shortDescription: getVal('shortDescription'),
        description: getVal('shortDescription'),
        published: getVal('published', 'true') === 'true'
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