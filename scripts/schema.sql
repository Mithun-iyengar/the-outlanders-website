-- SQL Schema for The Outlanders Production CMS (PostgreSQL / Supabase)

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TREKS TABLE
CREATE TABLE IF NOT EXISTS treks (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  category VARCHAR(128) NOT NULL,
  location VARCHAR(255),
  date VARCHAR(128),
  duration VARCHAR(128),
  difficulty VARCHAR(64),
  price NUMERIC(10, 2) DEFAULT 0,
  image TEXT,
  cover_image TEXT,
  featured_image TEXT,
  short_description TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  itinerary TEXT,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 3. TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  category VARCHAR(128) NOT NULL,
  location VARCHAR(255),
  date VARCHAR(128),
  duration VARCHAR(128),
  price NUMERIC(10, 2) DEFAULT 0,
  image TEXT,
  cover_image TEXT,
  description TEXT,
  short_description TEXT,
  itinerary TEXT,
  published BOOLEAN DEFAULT true,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  description TEXT,
  image TEXT,
  order_num INT DEFAULT 1,
  published BOOLEAN DEFAULT true,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 5. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS memories (
  id VARCHAR(64) PRIMARY KEY,
  image TEXT NOT NULL,
  category VARCHAR(128) DEFAULT 'General',
  order_num INT DEFAULT 1,
  published BOOLEAN DEFAULT true,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 6. CONTENT / SETTINGS JSON TABLE
CREATE TABLE IF NOT EXISTS content (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
