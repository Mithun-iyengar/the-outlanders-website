// trek-admin.js - list, add, edit, duplicate, delete treks using DataAPI with Category & Inclusions support
(function(){
  'use strict';

  function getVal(id, defaultVal = '') {
    const el = document.getElementById(id);
    return el ? el.value.trim() : defaultVal;
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    if(window.requireLogin) requireLogin();

    const tbody = document.querySelector('#treksTable tbody');
    if(tbody) await loadTreksTable();

    const form = document.getElementById('trekForm');
    if(form){
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      await renderFormFields();
      if(id){
        await fillForm(id);
      }

      form.addEventListener('submit', async function(e){
        e.preventDefault();
        await applyUploadedFiles();
        await saveTrek();
      });
    }

    async function saveTrek(){
      const submitBtn = document.querySelector('#trekForm button[type="submit"]');
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : 'PUBLISH TREK';

      try {
        if(submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }

        const payload = readForm();
        if(!payload.id || !payload.name || !payload.date || !payload.location){
          alert('Please fill all required fields (Name, ID, Date, Location)');
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if(id){
          await DataAPI.updateTrek(id, payload);
          alert('Trek updated successfully!');
          location.href = 'treks.html';
        } else {
          await DataAPI.createTrek(payload);
          alert('Trek created successfully!');
          location.href = 'treks.html';
        }
      } catch(err){
        console.error('Save Trek Error:', err);
        alert('Error saving trek: ' + (err.message || 'Server request failed'));
      } finally {
        if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnHtml;
        }
      }
    }

    async function loadTreksTable(){
      const treks = await DataAPI.getTreks();
      const tbody = document.querySelector('#treksTable tbody');
      if(!tbody) return;

      tbody.innerHTML = treks.map(t=>`
        <tr data-id="${t.id}">
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${t.coverImage || t.image || '../images/treks/kudremukha/cover.jpg'}" alt="" style="width: 46px; height: 34px; object-fit: cover; border-radius: 6px;" onerror="this.src='../images/treks/kudremukha/cover.jpg'">
              <div>
                <strong style="color: #17212B; font-size: 0.95rem; display: block;">${t.name}</strong>
                <span class="badge bg-light text-secondary border font-monospace mt-1">${t.category || 'Western Ghats'}</span>
              </div>
            </div>
          </td>
          <td><span class="fw-semibold" style="color: #1E293B;">${t.date || 'Every Friday Departure'}</span></td>
          <td><span style="color: #334155;">${t.location||''}</span></td>
          <td><span class="badge bg-light text-secondary border font-monospace">${t.difficulty || 'Moderate'}</span></td>
          <td><strong style="color: #0F172A; font-size: 0.95rem;">₹${Number(t.price||0).toLocaleString('en-IN')}</strong></td>
          <td>${t.published !== false ? '<span class="badge status-published">Published</span>' : '<span class="badge status-draft">Draft</span>'}</td>
          <td>
            <a class="btn btn-sm btn-outline-primary me-1" href="edit-trek.html?id=${t.id}">Edit Card</a>
            <button class="btn btn-sm btn-secondary me-1 duplicate">Duplicate</button>
            <button class="btn btn-sm btn-outline-danger delete">Delete</button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.delete').forEach(btn=>btn.addEventListener('click', async function(){
        const row = this.closest('tr'); const id = row.getAttribute('data-id');
        if(confirm('Are you sure you want to delete this trek?')){
          await DataAPI.deleteTrek(id);
          row.remove();
        }
      }));

      document.querySelectorAll('.duplicate').forEach(btn=>btn.addEventListener('click', async function(){
        const row = this.closest('tr'); const id = row.getAttribute('data-id');
        const newId = prompt('New ID/slug for duplicate trek:', id+'-copy');
        if(newId){
          try{
            const trek = await DataAPI.getTrekById(id);
            if(trek){
              trek.id = newId;
              trek.name = trek.name + ' (Copy)';
              await DataAPI.createTrek(trek);
              alert('Duplicated successfully');
              location.reload();
            }
          }catch(err){
            alert('Duplicate failed: ' + err.message);
          }
        }
      }));
    }

    async function renderFormFields(){
      const c = document.getElementById('formFields') || form;

      let categoryOptions = '<option value="Western Ghats">Western Ghats</option><option value="Weekend Trips">Weekend Trips</option><option value="Camping">Camping</option><option value="Road Trips">Road Trips</option><option value="Adventure Experiences">Adventure Experiences</option>';
      if(window.DataAPI && typeof window.DataAPI.getCategories === 'function'){
        try {
          const catList = await DataAPI.getCategories();
          if(catList && catList.length > 0){
            categoryOptions = catList.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
          }
        } catch(e) {
          console.error('Failed to load categories for trek form', e);
        }
      }

      const html = `
        <div class="row">
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Trek Name*</label><input class="form-control" id="name" placeholder="e.g. Kudremukha Trek" required></div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">ID / Slug*</label><input class="form-control" id="id" placeholder="e.g. kudremukha" required></div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Category (From Categories Manager)*</label>
            <select id="category" class="form-select" required>
              ${categoryOptions}
            </select>
          </div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Location*</label><input class="form-control" id="location" placeholder="e.g. Chikkamagaluru, Karnataka" required></div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Date / Schedule*</label>
            <input class="form-control" id="date" placeholder="e.g. Every Friday Departure or Oct 9-10" required>
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
          <div class="col-md-4 mb-3"><label class="form-label fw-bold">Available Slots</label><input id="availableSlots" class="form-control" type="number" placeholder="20"></div>
          <div class="col-md-4 mb-3"><label class="form-label fw-bold">Published State</label><select id="published" class="form-select"><option value="true">Published</option><option value="false">Draft</option></select></div>
        </div>

        <!-- Package Inclusions Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Package Inclusions & Features (One per line)</h6>
          <textarea id="inclusions" class="form-control" rows="4" placeholder="Professional Guide & Lead&#10;Meals & Refreshments&#10;First Aid & Safety Gear&#10;Permits & Local Entry Fees"></textarea>
          <div class="form-text text-muted small">Enter each package feature on a new line. These render on the frontend detail booking card.</div>
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

      if(coverInput && coverPrev){
        coverInput.addEventListener('input', ()=> coverPrev.src = coverInput.value);
      }
      if(coverFile && coverPrev){
        coverFile.addEventListener('change', async ()=>{
          if(coverFile.files && coverFile.files[0]){
            const file = coverFile.files[0];
            try {
              const res = await DataAPI.uploadFile(file);
              const imgUrl = res.url || res.fullUrl;
              if(document.getElementById('coverImage')) document.getElementById('coverImage').value = imgUrl;
              coverPrev.src = imgUrl;
            } catch(e) {
              const dataUrl = await fileToDataURL(file);
              if(document.getElementById('coverImage')) document.getElementById('coverImage').value = dataUrl;
              coverPrev.src = dataUrl;
            }
          }
        });
      }

      if(itineraryInput && itineraryStatus){
        itineraryInput.addEventListener('input', ()=>{
          const val = itineraryInput.value;
          itineraryStatus.textContent = val ? (val.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
          itineraryStatus.className = val ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
        });
      }
      if(itineraryFile && itineraryStatus){
        itineraryFile.addEventListener('change', async ()=>{
          if(itineraryFile.files && itineraryFile.files[0]){
            const file = itineraryFile.files[0];
            if(itineraryStatus){
              itineraryStatus.textContent = 'Uploading...';
              itineraryStatus.className = 'small fw-bold text-warning text-truncate d-block mt-1';
            }
            try {
              const res = await DataAPI.uploadFile(file);
              const fileUrl = res.url || res.fullUrl;
              if(document.getElementById('itinerary')) document.getElementById('itinerary').value = fileUrl;
              if(itineraryStatus){
                itineraryStatus.textContent = file.name.substring(0, 18) + ' (Uploaded)';
                itineraryStatus.className = 'small fw-bold text-success text-truncate d-block mt-1';
              }
            } catch(err) {
              console.warn('PDF upload fallback to dataURL:', err);
              const dataUrl = await fileToDataURL(file);
              if(document.getElementById('itinerary')) document.getElementById('itinerary').value = dataUrl;
              if(itineraryStatus){
                itineraryStatus.textContent = file.name.substring(0, 18) + ' (Ready)';
                itineraryStatus.className = 'small fw-bold text-success text-truncate d-block mt-1';
              }
            }
          }
        });
      }
    }

    async function fillForm(id){
      const trek = await DataAPI.getTrekById(id);
      if(!trek) return alert('Trek not found');
      if(document.getElementById('id')) document.getElementById('id').value = trek.id || '';
      if(document.getElementById('name')) document.getElementById('name').value = trek.name || '';
      if(document.getElementById('category')) document.getElementById('category').value = trek.category || 'Western Ghats';
      if(document.getElementById('location')) document.getElementById('location').value = trek.location || '';
      if(document.getElementById('date')) document.getElementById('date').value = trek.date || 'Every Friday Departure';
      if(document.getElementById('duration')) document.getElementById('duration').value = trek.duration || '';

      if(document.getElementById('difficulty')) {
        const diffVal = trek.difficulty || 'Moderate';
        const selectEl = document.getElementById('difficulty');
        const match = Array.from(selectEl.options).find(o => o.value.toLowerCase() === diffVal.toLowerCase());
        if(match){
          selectEl.value = match.value;
        } else {
          const newOpt = new Option(diffVal, diffVal, true, true);
          selectEl.add(newOpt);
        }
      }

      const defaultInclusions = "Professional Guide & Lead\nMeals & Refreshments\nFirst Aid & Safety Gear\nPermits & Local Entry Fees";
      let incVal = trek.inclusions;
      if(Array.isArray(incVal)) incVal = incVal.join('\n');
      if(document.getElementById('inclusions')) document.getElementById('inclusions').value = incVal || defaultInclusions;

      if(document.getElementById('price')) document.getElementById('price').value = trek.price || '';
      if(document.getElementById('availableSlots')) document.getElementById('availableSlots').value = trek.availableSlots || '';
      if(document.getElementById('published')) document.getElementById('published').value = trek.published !== false ? 'true' : 'false';
      if(document.getElementById('shortDescription')) document.getElementById('shortDescription').value = trek.shortDescription || '';
      if(document.getElementById('description')) document.getElementById('description').value = trek.description || '';

      const coverVal = trek.coverImage || trek.image || '';
      if(document.getElementById('coverImage')) document.getElementById('coverImage').value = coverVal;
      const coverPrev = document.getElementById('coverPreview');
      if(coverPrev) coverPrev.src = coverVal || '../images/treks/kudremukha/cover.jpg';

      const itinVal = trek.itinerary || '';
      if(document.getElementById('itinerary')) document.getElementById('itinerary').value = itinVal;
      const itinStatus = document.getElementById('itineraryStatus');
      if(itinStatus){
        itinStatus.textContent = itinVal ? (itinVal.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
        itinStatus.className = itinVal ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
      }
    }

    function readForm(){
      const titleVal = getVal('name') || getVal('title');
      const rawInc = getVal('inclusions');
      const incList = rawInc ? rawInc.split('\n').map(s => s.trim()).filter(Boolean) : [];
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
        availableSlots: Number(getVal('availableSlots')) || 0,
        inclusions: incList.length > 0 ? incList : ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
        shortDescription: getVal('shortDescription'),
        description: getVal('description'),
        coverImage: getVal('coverImage'),
        image: getVal('coverImage'),
        itinerary: getVal('itinerary'),
        published: getVal('published', 'true') === 'true'
      };
    }
    
    async function applyUploadedFiles(){
      const coverInput = document.getElementById('coverFile');
      if(coverInput && coverInput.files && coverInput.files[0]){
        try {
          const res = await DataAPI.uploadFile(coverInput.files[0]);
          if(res && (res.url || res.fullUrl)){
            if(document.getElementById('coverImage')) document.getElementById('coverImage').value = res.url || res.fullUrl;
          } else {
            if(document.getElementById('coverImage')) document.getElementById('coverImage').value = await fileToDataURL(coverInput.files[0]);
          }
        } catch(e) {
          if(document.getElementById('coverImage')) document.getElementById('coverImage').value = await fileToDataURL(coverInput.files[0]);
        }
      }

      const itineraryInput = document.getElementById('itineraryFile');
      if(itineraryInput && itineraryInput.files && itineraryInput.files[0]){
        try {
          const res = await DataAPI.uploadFile(itineraryInput.files[0]);
          if(res && (res.url || res.fullUrl)){
            if(document.getElementById('itinerary')) document.getElementById('itinerary').value = res.url || res.fullUrl;
          } else {
            if(document.getElementById('itinerary')) document.getElementById('itinerary').value = await fileToDataURL(itineraryInput.files[0]);
          }
        } catch(e) {
          if(document.getElementById('itinerary')) document.getElementById('itinerary').value = await fileToDataURL(itineraryInput.files[0]);
        }
      }
    }

    function fileToDataURL(file){
      return new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

  });
})();
