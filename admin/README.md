Admin interface (frontend-only)

Current:
- Admin UI lives under `admin/` and uses `localStorage` via `frontend/js/data-api.js`.
- DataAPI loads initial data from `data/treks.json` and `data/trips.json` on first run, then stores edits in `localStorage` under key `outlanders_data_v1`.
- Authentication is a frontend-only session flag (sessionStorage). Do NOT use in production.

Files:
- `admin/index.html` — login page
- `admin/dashboard.html` — admin dashboard
- `admin/treks.html`, `admin/add-trek.html`, `admin/edit-trek.html` — trek management
- `admin/trips.html`, `admin/add-trip.html`, `admin/edit-trip.html` — trip management (skeletons)
- `admin/css/admin.css` — admin styles
- `admin/js/admin.js` — frontend auth plumbing
- `admin/js/trek-admin.js` — trek CRUD UI logic (uses DataAPI)
- `frontend/js/data-api.js` — data abstraction layer (localStorage fallback)

Image editing:
- Use `Cover Image` for Upcoming Adventures cards and trek detail pages.
- Use `Featured Destination Image` for the homepage Featured Destinations carousel.
- Each field accepts a URL or a selected local image file. Selected files are stored as data URLs in browser storage.
- Recommended assets are `cover.jpg` at 3:2 and `1.jpg` at approximately 3.4:1 under `images/treks/<trek-id>/`.

Future (recommended) integration steps:
1. Replace `DataAPI` methods with backend API calls (REST or GraphQL).
2. Implement secure authentication (JWT, sessions, OAuth) on server and replace `sessionStorage` flag.
3. Move media storage (images, itineraries) to cloud storage (S3, Azure Blob) and store URLs in DB.
4. Add server-side validation for all inputs and implement RBAC for admin roles.
5. Add server-side backups and exports for data.

How to test locally:
- Open `admin/index.html` in your static server (e.g. `python -m http.server` from project root) and login with any non-empty credentials.
- The data API will seed from `data/treks.json` on first run. Edits are kept in `localStorage`.
- Because this demo has no backend, admin edits are scoped to the browser origin. Use the frontend and admin through the same origin when testing edited data.

Notes:
- Do NOT rename or delete existing PDF files in `documents/` or images in `images/`.
 - Do NOT rename or delete existing PDF files. In this workspace they are located under `assets/documents/`.
- Before going to production, arrange server endpoints for the DataAPI functions: `getTreks`, `createTrek`, `updateTrek`, `deleteTrek`, and `duplicateTrek`.
