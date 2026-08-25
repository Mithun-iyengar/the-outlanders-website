// server/routes/upload.js - File Upload Endpoint for Persistent Images & Media
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

let multer = null;
try { multer = require('multer'); } catch(e){}

const UPLOADS_DIR = path.join(__dirname, '../../images/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let upload = null;
if (multer) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname) || '.jpg';
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
  });

  upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
  });
}

// POST /api/upload - Single File Upload (Protected)
router.post('/', authMiddleware, (req, res, next) => {
  if (upload) {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const relativeUrl = `../images/uploads/${req.file.filename}`;
      const fullUrl = `/images/uploads/${req.file.filename}`;
      return res.status(201).json({
        success: true,
        url: relativeUrl,
        fullUrl: fullUrl,
        filename: req.file.filename,
        size: req.file.size
      });
    });
  } else {
    // Base64 upload fallback
    const { base64, filename } = req.body || {};
    if (!base64) return res.status(400).json({ error: 'Base64 image data or file payload required' });
    const cleanFilename = (filename || 'upload-' + Date.now() + '.jpg').replace(/[^a-zA-Z0-9.-]/g, '-');
    const filePath = path.join(UPLOADS_DIR, cleanFilename);
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return res.status(201).json({
      success: true,
      url: `../images/uploads/${cleanFilename}`,
      fullUrl: `/images/uploads/${cleanFilename}`
    });
  }
});

module.exports = router;
