// server/routes/content.js - Settings, Homepage, About Us & Media Endpoints
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { authMiddleware } = require('../middleware/auth');

// === SETTINGS ===
router.get('/settings', async (req, res) => {
  try {
    const settings = await store.getContent('settings', store.DEFAULT_SETTINGS);
    return res.json(Object.assign({}, store.DEFAULT_SETTINGS, settings));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const current = await store.getContent('settings', store.DEFAULT_SETTINGS);
    const updated = Object.assign({}, store.DEFAULT_SETTINGS, current, req.body);
    await store.saveContent('settings', updated);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// === HOMEPAGE ===
router.get('/homepage', async (req, res) => {
  try {
    const hp = await store.getContent('homepage', store.DEFAULT_HOMEPAGE);
    return res.json(Object.assign({}, store.DEFAULT_HOMEPAGE, hp));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch homepage content' });
  }
});

router.put('/homepage', authMiddleware, async (req, res) => {
  try {
    const current = await store.getContent('homepage', store.DEFAULT_HOMEPAGE);
    const updated = Object.assign({}, store.DEFAULT_HOMEPAGE, current, req.body);
    await store.saveContent('homepage', updated);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update homepage content' });
  }
});

// === ABOUT US ===
router.get('/about', async (req, res) => {
  try {
    const about = await store.getContent('about', null);
    return res.json({ html: about });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch about content' });
  }
});

router.put('/about', authMiddleware, async (req, res) => {
  try {
    const { html } = req.body || {};
    await store.saveContent('about', html || '');
    return res.json({ success: true, html });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update about content' });
  }
});

// === MEDIA LIBRARY ===
router.get('/media', async (req, res) => {
  try {
    const media = await store.getContent('media', []);
    return res.json(media);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

router.post('/media', authMiddleware, async (req, res) => {
  try {
    let media = await store.getContent('media', []);
    const item = req.body;
    if (!item || !item.name) {
      return res.status(400).json({ error: 'Media name is required' });
    }
    item.id = item.id || ('m-' + Date.now());
    media.unshift(item);
    await store.saveContent('media', media);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add media' });
  }
});

router.delete('/media/:id', authMiddleware, async (req, res) => {
  try {
    let media = await store.getContent('media', []);
    media = media.filter(m => m.id !== req.params.id);
    await store.saveContent('media', media);
    return res.json({ success: true, message: 'Media item deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete media' });
  }
});

module.exports = router;
