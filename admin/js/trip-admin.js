// trip-admin.js - list, add, edit, duplicate, delete trips using DataAPI with Category & Inclusions support
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', async ()=>{
    if(window.requireLogin) requireLogin();

    const tbody = document.querySelector('#tripsTable tbody');
    if(tbody) await loadTripsTable();

    const form = document.getElementById('tripForm');
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
        await saveTrip();
      });
    }

    async function applyUploadedFiles(){
      const coverInput = document.getElementById('coverFile');
      if(coverInput && coverInput.files && coverInput.files[0]){
        document.getElementById('coverImage').value = await fileToDataURL(coverInput.files[0]);
      }
      const itineraryInput = document.getElementById('itineraryFile');
      if(itineraryInput && itineraryInput.files && itineraryInput.files[0]){
        document.getElementById('itinerary').value = await fileToDataURL(itineraryInput.files[0]);
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

    async function saveTrip(){
      const payload = readForm();
      const titleVal = payload.name || payload.title;
      if(!payload.id || !titleVal || !payload.date){
        alert('Please fill required fields (Title, ID, Date)'); return;
      }
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if(id){ 
        await DataAPI.updateTrip(id, payload); 
        alert('Trip updated successfully!'); 
        location.href='trips.html'; 
      } else { 
        await DataAPI.createTrip(payload); 
        alert('Trip created successfully!'); 
        location.href='trips.html'; 
      }
    }

    async function loadTripsTable(){
      const trips = await DataAPI.getTrips();
      const tbody = document.querySelector('#tripsTable tbody');
      if(!tbody) return;
      tbody.innerHTML = trips.map(t=>`
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
          <td><span class="fw-semibold" style="color: #1E293B;">${t.date || 'Every Friday Departure'}</span></td>
          <td><span style="color: #334155;">${t.location||''}</span></td>
          <td><span class="badge bg-light text-secondary border font-monospace">${t.difficulty || 'Easy'}</span></td>
          <td><strong style="color: #0F172A; font-size: 0.95rem;">₹${Number(t.price||0).toLocaleString('en-IN')}</strong></td>
          <td>${t.published !== false ? '<span class="badge status-published">Published</span>' : '<span class="badge status-draft">Draft</span>'}</td>
          <td>
            <a class="btn btn-sm btn-outline-primary me-1" href="edit-trip.html?id=${t.id}">Edit Card</a>
            <button class="btn btn-sm btn-secondary me-1 duplicate">Duplicate</button>
            <button class="btn btn-sm btn-outline-danger delete">Delete</button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.delete').forEach(btn=>btn.addEventListener('click', async function(){
        const row = this.closest('tr'); const id = row.getAttribute('data-id');
        if(confirm('Are you sure you want to delete this trip?')){
          await DataAPI.deleteTrip(id);
          row.remove();
        }
      }));

      document.querySelectorAll('.duplicate').forEach(btn=>btn.addEventListener('click', async function(){
        const row = this.closest('tr'); const id = row.getAttribute('data-id');
        const newId = prompt('New ID/slug for duplicate trip:', id+'-copy');
        if(newId){
          const trip = await DataAPI.getTripById(id);
          if(trip){
            trip.id = newId;
            trip.name = (trip.name || trip.title) + ' (Copy)';
            trip.title = trip.name;
            await DataAPI.createTrip(trip);
            alert('Duplicated successfully');
            location.reload();
          }
        }
      }));
    }

    async function renderFormFields(){
      const c = document.getElementById('formFields') || form;

      let categoryOptions = '<option value="Weekend Trips">Weekend Trips</option><option value="Road Trips">Road Trips</option><option value="Camping">Camping</option><option value="Western Ghats">Western Ghats</option><option value="Adventure Experiences">Adventure Experiences</option>';
      if(window.DataAPI && typeof window.DataAPI.getCategories === 'function'){
        try {
          const catList = await DataAPI.getCategories();
          if(catList && catList.length > 0){
            categoryOptions = catList.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
          }
        } catch(e) {
          console.error('Failed to load categories for trip form', e);
        }
      }

      const html = `
        <div class="row">
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Trip Title*</label><input class="form-control" id="title" placeholder="e.g. Gokarna Getaway" required></div>
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">ID / Slug*</label><input class="form-control" id="id" placeholder="e.g. gokarna-getaway" required></div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Category (From Categories Manager)*</label>
            <select id="category" class="form-select" required>
              ${categoryOptions}
            </select>
          </div>
          <div class="col-md-6 mb-3"><label class="form-label">Location</label><input class="form-control" id="location" placeholder="e.g. Gokarna, Karnataka"></div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Date / Schedule*</label>
            <input class="form-control" id="date" placeholder="e.g. Every Friday Departure or Oct 9-10" required>
          </div>
          <div class="col-md-4 mb-3"><label class="form-label">Price (₹)</label><input id="price" class="form-control" type="number" placeholder="2499"></div>
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
          <div class="col-md-6 mb-3"><label class="form-label fw-bold">Published State</label><select id="published" class="form-select"><option value="true">Published</option><option value="false">Draft</option></select></div>
        </div>

        <!-- Package Inclusions Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Package Inclusions & Features (One per line)</h6>
          <textarea id="inclusions" class="form-control" rows="4" placeholder="Professional Guide & Lead&#10;Meals & Refreshments&#10;First Aid & Safety Gear&#10;Permits & Local Entry Fees"></textarea>
          <div class="form-text text-muted small">Enter each package feature on a new line. These render on the frontend detail booking card.</div>
        </div>

        <!-- Trip Cover Image Section -->
        <div class="card p-3 mb-3 border">
          <h6 class="fw-bold mb-2"><i class="bi bi-image text-primary me-2"></i>Trip Card Cover Image</h6>
          <div class="row align-items-center">
            <div class="col-md-3">
              <div class="border rounded bg-dark p-1" style="height: 100px; overflow: hidden;">
                <img id="coverPreview" src="" alt="Trip Card Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='../images/trips/roadtrip-card.jpg'">
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
          <h6 class="fw-bold mb-2"><i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Itinerary PDF Document</h6>
          <div class="row align-items-center">
            <div class="col-md-3">
              <div class="border rounded bg-white p-2 text-center">
                <i class="bi bi-file-pdf display-5 text-danger d-block"></i>
                <span id="itineraryStatus" class="small fw-bold text-truncate d-block mt-1">No PDF Attached</span>
              </div>
            </div>
            <div class="col-md-9">
              <div class="mb-2">
                <label class="form-label small font-monospace">Itinerary File Path / URL</label>
                <input id="itinerary" class="form-control form-control-sm" placeholder="../assets/documents/Gokarna.pdf">
              </div>
              <div>
                <label class="form-label small font-monospace">Or Upload New Itinerary PDF File</label>
                <input id="itineraryFile" type="file" accept=".pdf,.doc,.docx" class="form-control form-control-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3"><label class="form-label">Short Description</label><textarea id="shortDescription" class="form-control" rows="3"></textarea></div>
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
            coverPrev.src = await fileToDataURL(coverFile.files[0]);
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
        itineraryFile.addEventListener('change', ()=>{
          if(itineraryFile.files && itineraryFile.files[0]){
            const fName = itineraryFile.files[0].name;
            itineraryStatus.textContent = fName.substring(0, 18);
            itineraryStatus.className = 'small fw-bold text-success text-truncate d-block mt-1';
          }
        });
      }
    }

    async function fillForm(id){
      const trip = await DataAPI.getTripById(id);
      if(!trip) return alert('Trip not found');
      document.getElementById('id').value = trip.id || '';
      document.getElementById('title').value = trip.name || trip.title || '';
      document.getElementById('date').value = trip.date || 'Every Friday Departure';
      document.getElementById('location').value = trip.location || '';
      document.getElementById('price').value = trip.price || '';
      
      const catSelect = document.getElementById('category');
      if(catSelect && trip.category) catSelect.value = trip.category;

      const diffSelect = document.getElementById('difficulty');
      if(diffSelect) diffSelect.value = trip.difficulty || 'Easy';

      const defaultInclusions = "Professional Guide & Lead\nMeals & Refreshments\nFirst Aid & Safety Gear\nPermits & Local Entry Fees";
      let incVal = trip.inclusions;
      if(Array.isArray(incVal)) incVal = incVal.join('\n');
      if(document.getElementById('inclusions')) document.getElementById('inclusions').value = incVal || defaultInclusions;

      const imgVal = trip.coverImage || trip.image || '';
      document.getElementById('coverImage').value = imgVal;
      
      const coverPrev = document.getElementById('coverPreview');
      if(coverPrev) coverPrev.src = imgVal || '../images/trips/roadtrip-card.jpg';

      const itinVal = trip.itinerary || '';
      document.getElementById('itinerary').value = itinVal;
      const itinStatus = document.getElementById('itineraryStatus');
      if(itinStatus){
        itinStatus.textContent = itinVal ? (itinVal.split('/').pop().substring(0, 18) || 'Attached') : 'No PDF Attached';
        itinStatus.className = itinVal ? 'small fw-bold text-success text-truncate d-block mt-1' : 'small fw-bold text-muted text-truncate d-block mt-1';
      }

      document.getElementById('shortDescription').value = trip.shortDescription || trip.description || '';
      document.getElementById('published').value = trip.published !== false ? 'true' : 'false';
    }

    function readForm(){
      const titleVal = document.getElementById('title').value.trim();
      const rawInc = document.getElementById('inclusions') ? document.getElementById('inclusions').value : '';
      const incList = rawInc.split('\n').map(s => s.trim()).filter(Boolean);

      return {
        id: document.getElementById('id').value.trim(),
        name: titleVal,
        title: titleVal,
        category: document.getElementById('category') ? document.getElementById('category').value : 'Weekend Trips',
        date: document.getElementById('date').value.trim() || 'Every Friday Departure',
        location: document.getElementById('location').value.trim(),
        price: Number(document.getElementById('price').value) || 0,
        difficulty: document.getElementById('difficulty') ? document.getElementById('difficulty').value : 'Easy',
        inclusions: incList.length > 0 ? incList : ['Professional Guide & Lead', 'Meals & Refreshments', 'First Aid & Safety Gear', 'Permits & Local Entry Fees'],
        coverImage: document.getElementById('coverImage').value.trim(),
        image: document.getElementById('coverImage').value.trim(),
        itinerary: document.getElementById('itinerary').value.trim(),
        shortDescription: document.getElementById('shortDescription').value.trim(),
        description: document.getElementById('shortDescription').value.trim(),
        published: document.getElementById('published').value === 'true'
      };
    }

  });
})();