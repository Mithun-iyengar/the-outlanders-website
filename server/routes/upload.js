// server/routes/upload.js - File Upload Endpoint for Persistent Cloud Storage (Supabase Storage / Local Backup)
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

let multer = null;
try { multer = require('multer'); } catch(e){}

let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    );
  } catch (e) {
    console.warn('Supabase Storage Client Init warning:', e.message);
  }
}

const UPLOADS_DIR = path.join(__dirname, '../../images/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let upload = null;
if (multer) {
  const storage = multer.memoryStorage();
  upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|webp|gif|svg|pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) return cb(null, true);
      cb(null, true); // Permissive upload for user attachments
    }
  });
}

// POST /api/upload - Single File Upload (Protected)
router.post('/', authMiddleware, async (req, res, next) => {
  if (upload) {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const ext = path.extname(req.file.originalname) || '.jpg';
      const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `${cleanName}-${Date.now()}${ext}`;

      // 1. Supabase Storage persistent upload if configured
      if (supabase) {
        try {
          const bucketName = process.env.SUPABASE_BUCKET || 'outlanders-images';
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filename, req.file.buffer, {
              contentType: req.file.mimetype || 'image/jpeg',
              upsert: true
            });

          if (!error && data) {
            const { data: publicData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filename);

            const publicUrl = publicData.publicUrl;
            return res.status(201).json({
              success: true,
              url: publicUrl,
              fullUrl: publicUrl,
              filename: filename,
              provider: 'supabase'
            });
          } else {
            console.warn('Supabase storage upload error:', error ? error.message : 'Unknown');
          }
        } catch (supabaseErr) {
          console.warn('Supabase storage upload exception, falling back to disk:', supabaseErr.message);
        }
      }

      // 2. Local Disk Backup
      const diskPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(diskPath, req.file.buffer);
      const relativeUrl = `../images/uploads/${filename}`;
      const fullUrl = `/images/uploads/${filename}`;

      return res.status(201).json({
        success: true,
        url: relativeUrl,
        fullUrl: fullUrl,
        filename: filename,
        provider: 'disk'
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
      fullUrl: `/images/uploads/${cleanFilename}`,
      provider: 'disk'
    });
  }
});

module.exports = router;
