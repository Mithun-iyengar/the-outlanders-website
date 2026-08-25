// server/routes/trips.js - REST API Endpoints for Trips
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { authMiddleware } = require('../middleware/auth');

// GET /api/trips - Public
router.get('/', async (req, res) => {
  try {
    const trips = await store.getTrips();
    return res.json(trips);
  } catch (err) {
    console.error('GET /api/trips error:', err);
    return res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const trips = await store.getTrips();
    const trip = trips.find(t => t.id === req.params.id || t.slug === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    return res.json(trip);
  } catch (err) {
    console.error('GET /api/trips/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// POST /api/trips - Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const tripData = req.body;
    if (!tripData || !tripData.name) {
      return res.status(400).json({ error: 'Trip name is required' });
    }

    if (!tripData.id) {
      const slugBase = (tripData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      tripData.id = slugBase || ('trip-' + Date.now());
      tripData.slug = tripData.id;
    }

    const saved = await store.saveTrip(tripData);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/trips error:', err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PUT /api/trips/:id - Protected
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const trips = await store.getTrips();
    const existing = trips.find(t => t.id === req.params.id || t.slug === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const updatedData = Object.assign({}, existing, req.body, { id: existing.id });
    const saved = await store.saveTrip(updatedData);
    return res.json(saved);
  } catch (err) {
    console.error('PUT /api/trips/:id error:', err);
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id - Protected
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const trips = await store.getTrips();
    const existing = trips.find(t => t.id === req.params.id || t.slug === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await store.deleteTrip(req.params.id);
    return res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/trips/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
});

module.exports = router;
