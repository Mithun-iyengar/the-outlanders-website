// server/routes/treks.js - REST API Endpoints for Treks
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { authMiddleware } = require('../middleware/auth');

// GET /api/treks - Public
router.get('/', async (req, res) => {
  try {
    const treks = await store.getTreks();
    const { category, featured } = req.query;

    let filtered = [...treks];
    if (category && category !== 'All') {
      filtered = filtered.filter(t => (t.category || '').toLowerCase() === category.toLowerCase());
    }
    if (featured === 'true') {
      filtered = filtered.filter(t => t.featured === true);
    }

    return res.json(filtered);
  } catch (err) {
    console.error('GET /api/treks error:', err);
    return res.status(500).json({ error: 'Failed to fetch treks' });
  }
});

// GET /api/treks/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const trek = await store.getTrekById(req.params.id);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    return res.json(trek);
  } catch (err) {
    console.error('GET /api/treks/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch trek' });
  }
});

// POST /api/treks - Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const trekData = req.body;
    if (!trekData || !trekData.name) {
      return res.status(400).json({ error: 'Trek name is required' });
    }

    if (!trekData.id) {
      const slugBase = (trekData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      trekData.id = slugBase || ('trek-' + Date.now());
      trekData.slug = trekData.id;
    }

    const saved = await store.saveTrek(trekData);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/treks error:', err);
    return res.status(500).json({ error: 'Failed to create trek: ' + err.message });
  }
});

// PUT /api/treks/:id - Protected
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await store.getTrekById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trek not found' });
    }

    const updatedData = Object.assign({}, existing, req.body, { id: existing.id });
    const saved = await store.saveTrek(updatedData);
    return res.json(saved);
  } catch (err) {
    console.error('PUT /api/treks/:id error:', err);
    return res.status(500).json({ error: 'Failed to update trek: ' + err.message });
  }
});

// DELETE /api/treks/:id - Protected
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await store.getTrekById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trek not found' });
    }

    await store.deleteTrek(req.params.id);
    return res.json({ success: true, message: 'Trek deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/treks/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete trek' });
  }
});

// POST /api/treks/duplicate/:id - Protected
router.post('/duplicate/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await store.getTrekById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Source trek not found' });
    }

    const newId = (req.body && req.body.newId) || (existing.id + '-copy-' + Date.now().toString(36));
    const copy = JSON.parse(JSON.stringify(existing));
    copy.id = newId;
    copy.slug = newId;
    copy.name = copy.name + ' (Copy)';
    copy.published = false;
    copy.created_at = Date.now();

    const saved = await store.saveTrek(copy);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/treks/duplicate/:id error:', err);
    return res.status(500).json({ error: 'Failed to duplicate trek' });
  }
});

module.exports = router;
