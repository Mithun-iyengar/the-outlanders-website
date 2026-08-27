// server/routes/memories.js - REST API Endpoints for Memories Gallery
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { authMiddleware } = require('../middleware/auth');

// GET /api/memories/debug - Public Production Diagnostic Endpoint
router.get('/debug', async (req, res) => {
  const db = require('../config/db');
  try {
    const isConnected = db.isDbConnected();
    const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    let rowsCount = 0;
    let sampleRows = [];
    let queryError = null;

    if (isConnected) {
      try {
        const queryRes = await db.query('SELECT id, image, category, order_num, created_at FROM memories ORDER BY order_num ASC, created_at DESC LIMIT 5');
        const countRes = await db.query('SELECT COUNT(*) FROM memories');
        rowsCount = countRes.rows[0] ? countRes.rows[0].count : 0;
        sampleRows = queryRes.rows;
      } catch (err) {
        queryError = err.message;
      }
    }

    return res.json({
      status: 'ok',
      dbConnected: isConnected,
      hasDbUrl: hasDbUrl,
      environment: process.env.VERCEL ? 'vercel-production' : (process.env.NODE_ENV || 'development'),
      postgresRowsCount: parseInt(rowsCount, 10) || 0,
      latestMemories: sampleRows,
      queryError: queryError
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/memories - Public
router.get('/', async (req, res) => {
  try {
    const mems = await store.getMemories();
    return res.json(mems);
  } catch (err) {
    console.error('GET /api/memories error:', err);
    return res.status(500).json({ error: 'Failed to fetch memories: ' + err.message });
  }
});

// PUT /api/memories - Protected (bulk update / replace list)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const memoriesList = req.body;
    if (!Array.isArray(memoriesList)) {
      return res.status(400).json({ error: 'Memories payload must be an array' });
    }

    const saved = await store.saveMemories(memoriesList);
    return res.json(saved);
  } catch (err) {
    console.error('PUT /api/memories error:', err);
    return res.status(500).json({ error: 'Failed to save memories: ' + err.message });
  }
});

// POST /api/memories - Protected (add single memory)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const mems = await store.getMemories();
    const item = req.body;
    if (!item || !item.image) {
      return res.status(400).json({ error: 'Memory image URL is required' });
    }

    item.id = item.id || ('mem-' + Date.now());
    item.order = item.order || (mems.length + 1);
    item.created_at = item.created_at || Date.now();
    item.published = item.published !== false;

    mems.unshift(item);
    await store.saveMemories(mems);
    return res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/memories error:', err);
    return res.status(500).json({ error: 'Failed to add memory' });
  }
});

// DELETE /api/memories/:id - Protected
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    let mems = await store.getMemories();
    mems = mems.filter(m => m.id !== req.params.id);
    await store.saveMemories(mems);
    return res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/memories/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
});

module.exports = router;
