// server/routes/upload.js - Serverless-Safe File Upload System (Supabase Storage + Local Backup)
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const UPLOADS_DIR = path.join(__dirname, '../../images/uploads');

// Safe lazy local directory initialization (ONLY for local development)
function ensureLocalUploadDir(folder = '') {
  if (isVercel) return null;
  try {
    const targetDir = folder ? path.join(UPLOADS_DIR, folder) : UPLOADS_DIR;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  } catch (e) {
    console.warn('Local directory creation skipped:', e.message);
    return null;
  }
}

let multer = null;
try { multer = require('multer'); } catch(e){}

let upload = null;
if (multer) {
  const storage = multer.memoryStorage();
  upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
      cb(null, true);
    }
  });
}

// Initialize Supabase Storage client securely
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || 'https://qcwnzaeydvosuiclddqr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OgXymBA4gWFDUOuykSgvCA_6SRbPjSL';
  if (!url || !key) return null;

  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, key, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.warn('Supabase client initialization warning:', e.message);
    return null;
  }
}

async function processSingleUpload(file, folder = '') {
  const ext = path.extname(file.originalname) || '.jpg';
  const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const subFolder = folder ? folder.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '/' : '';
  const filename = `${subFolder}${cleanName}-${Date.now()}${ext}`;

  const supabase = getSupabaseClient();
  let supabaseErrorMsg = null;

  if (supabase) {
    try {
      const bucketName = process.env.SUPABASE_BUCKET || 'outlanders-images';
      const contentType = file.mimetype || (ext.toLowerCase() === '.pdf' ? 'application/pdf' : 'image/jpeg');

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file.buffer, {
          contentType: contentType,
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filename);

        const finalUrl = publicData.publicUrl;
        console.log(`✅ Uploaded file directly to Supabase Storage bucket "${bucketName}":`, finalUrl);

        return {
          success: true,
          url: finalUrl,
          fullUrl: finalUrl,
          filename: filename,
          provider: 'supabase'
        };
      } else if (error) {
        supabaseErrorMsg = error.message;
        console.warn('Supabase storage upload error:', error.message);
      }
    } catch (supabaseErr) {
      supabaseErrorMsg = supabaseErr.message;
      console.warn('Supabase storage upload exception:', supabaseErr.message);
    }
  }

  // Strictly fail on Vercel if cloud storage upload fails
  if (isVercel) {
    return {
      success: false,
      error: `Supabase Storage upload failed: ${supabaseErrorMsg || 'Storage credentials or RLS policies unconfigured'}. Ensure bucket "outlanders-images" has public INSERT policy or configure SUPABASE_SERVICE_ROLE_KEY.`
    };
  }

  // Local disk backup if running locally in development mode
  try {
    const folderDir = ensureLocalUploadDir(folder);
    if (folderDir) {
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
  } catch (diskErr) {
    console.warn('Disk upload write skipped:', diskErr.message);
  }

  // Memory Base64 Fallback as absolute last resort for local dev
  const mime = file.mimetype || (ext.toLowerCase() === '.pdf' ? 'application/pdf' : 'image/jpeg');
  const base64Str = `data:${mime};base64,${file.buffer.toString('base64')}`;
  return {
    success: true,
    url: base64Str,
    fullUrl: base64Str,
    filename: file.originalname,
    provider: 'memory'
  };
}

// POST /api/upload - Single File Upload (Protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';

    // Handle JSON Base64 Upload
    if (req.body && (req.body.base64 || req.body.image || req.body.file)) {
      const base64Payload = req.body.base64 || req.body.image || req.body.file;
      const originalName = req.body.filename || ('upload-' + Date.now() + '.png');
      const folder = req.query.folder || req.body.folder || '';

      const base64Clean = base64Payload.replace(/^data:[^;]+;base64,/, '');
      const fileBuffer = Buffer.from(base64Clean, 'base64');
      const mimeMatch = base64Payload.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

      const fileObj = {
        originalname: originalName,
        mimetype: mimeType,
        buffer: fileBuffer
      };

      const result = await processSingleUpload(fileObj, folder);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(201).json(result);
    }

    // Handle Multipart Form Upload
    if (upload && contentType.includes('multipart')) {
      upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        if (!req.file) {
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const folder = req.query.folder || req.body.folder || '';
        const result = await processSingleUpload(req.file, folder);
        if (!result.success) {
          return res.status(400).json(result);
        }
        return res.status(201).json(result);
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'No valid file attachment or base64 payload provided.'
      });
    }
  } catch (err) {
    console.error('POST /api/upload handler error:', err);
    return res.status(500).json({ success: false, error: 'Upload failed: ' + err.message });
  }
});

// POST /api/upload/batch - Multiple File Upload (Protected)
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    if (!upload) return res.status(400).json({ success: false, error: 'Multer unavailable' });

    upload.array('files', 50)(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: 'No files uploaded' });

      const folder = req.query.folder || req.body.folder || '';
      const results = [];

      for (let file of req.files) {
        const resSingle = await processSingleUpload(file, folder);
        if (!resSingle.success) {
          return res.status(400).json(resSingle);
        }
        results.push(resSingle);
      }

      return res.status(201).json({
        success: true,
        count: results.length,
        files: results
      });
    });
  } catch (err) {
    console.error('POST /api/upload/batch handler error:', err);
    return res.status(500).json({ success: false, error: 'Batch upload failed: ' + err.message });
  }
});

module.exports = router;
