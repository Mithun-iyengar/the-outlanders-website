// server/routes/categories.js - REST API Endpoints for Categories
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { authMiddleware } = require('../middleware/auth');

// GET /api/categories - Public
router.get('/', async (req, res) => {
  try {
    const cats = await store.getCategories();
    return res.json(cats);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const cats = await store.getCategories();
    const newCat = req.body;

    if (!newCat || !newCat.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    newCat.id = newCat.id || ('cat-' + Date.now());
    newCat.slug = newCat.slug || newCat.name;
    newCat.order = newCat.order || (cats.length + 1);
    newCat.published = newCat.published !== false;

    cats.push(newCat);
    const saved = await store.saveCategories(cats);
    return res.status(201).json(newCat);
  } catch (err) {
    console.error('POST /api/categories error:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Protected
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const cats = await store.getCategories();
    const idx = cats.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    cats[idx] = Object.assign({}, cats[idx], req.body);
    await store.saveCategories(cats);
    return res.json(cats[idx]);
  } catch (err) {
    console.error('PUT /api/categories/:id error:', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Protected
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    let cats = await store.getCategories();
    const existing = cats.find(c => c.id === req.params.id || c.slug === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    cats = cats.filter(c => c.id !== req.params.id && c.slug !== req.params.id);
    await store.saveCategories(cats);
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/categories/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
