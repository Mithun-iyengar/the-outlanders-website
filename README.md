# THE OUTLANDERS — Production Online CMS & REST API Backend

> **Explore Beyond The Ordinary** — Registered Adventure & Travel Company. Handcrafted Western Ghats Treks, Road Trips, Weekend Camping Escapes, and Outdoor Experiences.

---

## 🏛️ Architecture Overview

The Outlanders website has been converted into a production-grade online CMS powered by a Node.js Express REST API backend and PostgreSQL database (Supabase DB).

```
PUBLIC WEBSITE (Frontend HTML/JS/CSS)
   │
   ▼  GET /api/treks, GET /api/trips, GET /api/memories, GET /api/categories
BACKEND REST API (Node.js + Express)
   │
   ├── JWT Auth Middleware (Secures POST / PUT / DELETE)
   ├── Multer Persistent File Uploads (/images/uploads/)
   ▼
DATABASE (PostgreSQL / Supabase DB)
   ▲
   │  POST / PUT / DELETE (Bearer Token Authenticated)
ADMIN PANEL (HTML/JS/CSS CMS Manager)
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=outlanders_dev_jwt_secret_key_2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=outlanders2026
```

### 3. Run Data Migration & Seeding
Import initial data from `data/treks.json` and `data/trips.json`:
```bash
npm run migrate
```

### 4. Start the CMS Server
```bash
npm start
# OR for live reloads:
npm run dev
```

Server URLs:
- **REST API Health Check**: `http://localhost:5000/api/health`
- **Public Website**: `http://localhost:5000/frontend/index.html`
- **Admin Panel**: `http://localhost:5000/admin/index.html`

---

## 🔑 Admin Credentials

- **Admin Login Page**: `http://localhost:5000/admin/index.html`
- **Username**: `admin`
- **Password**: `outlanders2026`
- **Password Hashing**: Encrypted server-side using `bcryptjs`.
- **Change Password**: Go to **Admin Panel** → **Settings & Social** → **Admin Account Security & Password**.

---

## 🗄️ Database Schema & Supabase Setup (Free Tier)

### 1. Create Supabase Project
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Navigate to **Project Settings** → **Database** → Copy your `DATABASE_URL` connection string:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. Update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 2. Run Database Migration to Supabase
Run:
```bash
npm run migrate
```
This automatically creates all PostgreSQL tables (`admin_users`, `treks`, `trips`, `categories`, `memories`, `content`) and seeds initial trek/trip records into Supabase.

---

## 🌐 Deploying Backend to Render (Free Tier)

1. Create a free account on [Render.com](https://render.com).
2. Connect your GitHub repository `https://github.com/Mithun-iyengar/the-outlanders-website`.
3. Create a **New Web Service**:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables in Render Dashboard:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `your_supabase_postgresql_connection_string`
   - `JWT_SECRET` = `a_secure_random_jwt_secret_key`
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = `your_secure_admin_password`
   - `FRONTEND_URL` = `https://your-frontend.vercel.app`

Render will give you your production API URL (e.g. `https://outlanders-cms-backend.onrender.com`).

---

## 🎨 Deploying Frontend to Vercel (Free Tier)

1. Create a free account on [Vercel.com](https://vercel.com).
2. Import repository `https://github.com/Mithun-iyengar/the-outlanders-website`.
3. Vercel automatically detects `vercel.json`.
4. Deploy! Your website will be live with full dynamic backend integration.

---

## 🧪 Critical Acceptance Test Verification

1. Log into Admin Panel at `/admin/index.html` using `admin` / `outlanders2026`.
2. Navigate to **Treks Manager** → Click **ADD NEW TREK**.
3. Create a trek named `"TEST OUTLANDERS TREK"` with price `2999`.
4. Save the trek.
5. Open the public website in an incognito window (`/frontend/treks.html`).
6. Verify `"TEST OUTLANDERS TREK"` appears immediately.
7. Edit its price in Admin to `3499`.
8. Refresh the public incognito window -> verify price `3499` appears.
9. Delete `"TEST OUTLANDERS TREK"` in Admin.
10. Refresh public website -> verify it disappears cleanly.

---

## 📁 Repository Structure

```
├── admin/               # Admin CMS UI & Management Scripts
├── assets/documents/    # PDF Trek Itineraries
├── data/                # Initial JSON Data Backups
├── frontend/            # Public Website Pages, CSS & DataAPI Client
│   └── js/data-api.js   # Production REST API Integration Layer
├── images/              # Media & Uploaded Images
├── scripts/
│   ├── schema.sql       # PostgreSQL Table Schemas
│   └── migrate-data.js  # Migration & Data Seeding Script
├── server/
│   ├── config/db.js     # PostgreSQL Pool Configuration
│   ├── middleware/auth.js # Server-Side JWT Auth Guard
│   ├── routes/          # REST API Route Controllers
│   ├── services/store.js# Unified Data Access Layer
│   └── server.js        # Express Server Entrypoint
├── .env.example         # Environment Variable Template
├── package.json         # Node.js Dependencies & Scripts
├── render.yaml          # Render Deployment Config
└── vercel.json          # Vercel Deployment Config
```
