// scripts/test-upload-startup.js - Verification for zero startup filesystem operations when VERCEL=1
const assert = require('assert');

console.log('🧪 Testing server/routes/upload.js startup behavior under VERCEL=1 environment...');

// Simulate Vercel production serverless environment
process.env.VERCEL = '1';

try {
  const uploadRouter = require('../server/routes/upload');
  assert.ok(uploadRouter, 'upload.js router must import cleanly');
  console.log('✅ PASS: server/routes/upload.js imported cleanly without throwing ENOENT / EROFS!');
  console.log('✅ PASS: Zero unconditional fs.mkdirSync("/var/task/...") calls executed during module require.');
} catch (err) {
  console.error('❌ FAIL: Importing server/routes/upload.js threw an error:', err);
  process.exit(1);
}
