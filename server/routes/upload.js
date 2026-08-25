// server/routes/upload.js - File Upload Endpoint for Persistent Cloud Storage & Local Backup
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
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
      cb(null, true);
    }
  });
}

async function uploadSingleFileToProvider(file, folder = '') {
  const ext = path.extname(file.originalname) || '.jpg';
  const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const subFolder = folder ? folder.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '/' : '';
  const filename = `${subFolder}${cleanName}-${Date.now()}${ext}`;

  if (supabase) {
    try {
      const bucketName = process.env.SUPABASE_BUCKET || 'outlanders-images';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filename);

        return {
          success: true,
          url: publicData.publicUrl,
          fullUrl: publicData.publicUrl,
          filename: filename,
          provider: 'supabase'
        };
      }
    } catch (supabaseErr) {
      console.warn('Supabase storage upload exception:', supabaseErr.message);
    }
  }

  const folderDir = folder ? path.join(UPLOADS_DIR, folder) : UPLOADS_DIR;
  if (!fs.existsSync(folderDir)) {
    fs.mkdirSync(folderDir, { recursive: true });
  }

  const baseFilename = `${cleanName}-${Date.now()}${ext}`;
  const diskPath = path.join(folderDir, baseFilename);
  fs.writeFileSync(diskPath, file.buffer);

  const relPath = folder ? `../images/uploads/${folder}/${baseFilename}` : `../images/uploads/${baseFilename}`;
  const fullPath = folder ? `/images/uploads/${folder}/${baseFilename}` : `/images/uploads/${baseFilename}`;

  return {
    success: true,
    url: relPath,
    fullUrl: fullPath,
    filename: baseFilename,
    provider: 'disk'
  };
}

// POST /api/upload - Single File Upload (Protected)
router.post('/', authMiddleware, async (req, res) => {
  const contentType = req.headers['content-type'] || '';
  console.log('UPLOAD ROUTE HIT -> Content-Type:', contentType, 'Body:', req.body ? Object.keys(req.body) : 'none');

  if (req.body && (req.body.base64 || req.body.image || req.body.file)) {
    const base64 = req.body.base64 || req.body.image || req.body.file;
    const filename = req.body.filename || ('upload-' + Date.now() + '.png');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filePath = path.join(UPLOADS_DIR, cleanFilename);
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    return res.status(201).json({
      success: true,
      url: `../images/uploads/${cleanFilename}`,
      fullUrl: `/images/uploads/${cleanFilename}`,
      filename: cleanFilename,
      provider: 'disk'
    });
  }

  if (upload && contentType.includes('multipart')) {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const folder = req.query.folder || req.body.folder || '';
      const result = await uploadSingleFileToProvider(req.file, folder);
      return res.status(201).json(result);
    });
  } else {
    return res.status(400).json({ error: 'No file uploaded. Expected multipart form-data or JSON with base64 field.' });
  }
});

// POST /api/upload/batch - Multiple File Upload (Protected)
router.post('/batch', authMiddleware, async (req, res) => {
  if (!upload) return res.status(400).json({ error: 'Multer is required for batch uploads' });

  upload.array('files', 50)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const folder = req.query.folder || req.body.folder || '';
    const results = [];

    for (let file of req.files) {
      const resSingle = await uploadSingleFileToProvider(file, folder);
      results.push(resSingle);
    }

    return res.status(201).json({
      success: true,
      count: results.length,
      files: results
    });
  });
});

module.exports = router;
