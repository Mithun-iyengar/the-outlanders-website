// server/server.js - Express Server Entry Point for The Outlanders Production CMS
const express = require('express');
const path = require('path');

try { require('dotenv').config(); } catch(e){}

let cors = null;
try { cors = require('cors'); } catch(e){}

let helmet = null;
try { helmet = require('helmet'); } catch(e){}

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Headers Middleware
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  }));
}

// Dynamic CORS Configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'https://the-outlanders-website.vercel.app,http://localhost:8000,http://127.0.0.1:8000,http://localhost:5000')
  .split(',')
  .map(o => o.trim());

if (cors) {
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  }));
} else {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
}

// Body Parsing Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets Serving
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../')));

// === HEALTH CHECK ENDPOINT ===
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbConnected: db.isDbConnected(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// === REST API ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/treks', require('./routes/treks'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/memories', require('./routes/memories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api', require('./routes/content'));

// Centralized 404 Handler for API
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: `API Endpoint ${req.originalUrl} not found` });
  }
  next();
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 The Outlanders Production CMS Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Public Website: http://localhost:${PORT}/frontend/index.html`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin/index.html`);
});

module.exports = app;
