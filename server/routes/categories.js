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

// GET /api/categories/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const cats = await store.getCategories();
    const cat = cats.find(c => c.id === req.params.id || c.slug === req.params.id);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.json(cat);
  } catch (err) {
    console.error('GET /api/categories/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories - Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newCat = req.body;
    if (!newCat || !newCat.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const saved = await store.saveCategory(newCat);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/categories error:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Protected
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const catData = Object.assign({}, req.body, { id: req.params.id });
    const saved = await store.saveCategory(catData);
    return res.json(saved);
  } catch (err) {
    console.error('PUT /api/categories/:id error:', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Protected
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await store.deleteCategory(req.params.id);
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/categories/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
