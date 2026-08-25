-- SQL Script: Row Level Security (RLS) Policies for The Outlanders Supabase Database (Option B)

-- 1. Enable Row Level Security on all 6 tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE treks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (Idempotent execution)
DROP POLICY IF EXISTS "Deny public access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Public read published treks" ON treks;
DROP POLICY IF EXISTS "Admin full access treks" ON treks;
DROP POLICY IF EXISTS "Public read published trips" ON trips;
DROP POLICY IF EXISTS "Admin full access trips" ON trips;
DROP POLICY IF EXISTS "Public read published categories" ON categories;
DROP POLICY IF EXISTS "Admin full access categories" ON categories;
DROP POLICY IF EXISTS "Public read published memories" ON memories;
DROP POLICY IF EXISTS "Admin full access memories" ON memories;
DROP POLICY IF EXISTS "Public read content" ON content;
DROP POLICY IF EXISTS "Admin full access content" ON content;

-- 3. Define Refined Option B RLS Policies

-- ADMIN_USERS: Strictly block public/anon access. Protect password hashes.
CREATE POLICY "Deny public access to admin_users"
  ON admin_users
  FOR ALL
  TO anon
  USING (false);

-- TREKS: Public read published treks only. Block public inserts, updates, deletes.
CREATE POLICY "Public read published treks"
  ON treks
  FOR SELECT
  TO anon
  USING (published = true);

-- TRIPS: Public read published trips only. Block public inserts, updates, deletes.
CREATE POLICY "Public read published trips"
  ON trips
  FOR SELECT
  TO anon
  USING (published = true);

-- CATEGORIES: Public read published categories only. Block public writes.
CREATE POLICY "Public read published categories"
  ON categories
  FOR SELECT
  TO anon
  USING (published = true);

-- MEMORIES: Public read published memories only. Block public writes.
CREATE POLICY "Public read published memories"
  ON memories
  FOR SELECT
  TO anon
  USING (published = true);

-- CONTENT: Public read site content. Block public writes.
CREATE POLICY "Public read content"
  ON content
  FOR SELECT
  TO anon
  USING (true);
