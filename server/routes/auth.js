// server/routes/auth.js - Authentication Endpoints with Zero-Dependency Native Crypto Fallback
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const db = require('../config/db');
const store = require('../services/store');

try { require('dotenv').config(); } catch(e){}

let jwt = null;
try { jwt = require('jsonwebtoken'); } catch(e){}

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch(e){}

function hashPassword(password) {
  if (!password) return '';
  if (bcrypt) {
    return bcrypt.hashSync(password.trim(), 10);
  }
  const salt = 'outlanders_salt_2026';
  return 'pbkdf2:' + crypto.pbkdf2Sync(password.trim(), salt, 1000, 32, 'sha256').toString('hex');
}

function comparePassword(password, storedHash) {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith('$2') && bcrypt) {
    try { return bcrypt.compareSync(password.trim(), storedHash); } catch(e){}
  }
  if (storedHash.startsWith('pbkdf2:')) {
    const calc = hashPassword(password);
    return calc === storedHash;
  }
  const calc = hashPassword(password);
  return calc === storedHash;
}

const DEFAULT_ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'outlanders2026';

let storedAdminPassHash = hashPassword(DEFAULT_ADMIN_PASS);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let isValid = false;
    let userId = 'admin-1';
    let matchedUser = DEFAULT_ADMIN_USER;

    if (db.isDbConnected()) {
      try {
        const dbRes = await db.query('SELECT * FROM admin_users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
        if (dbRes.rows.length > 0) {
          const userRow = dbRes.rows[0];
          if (comparePassword(password, userRow.password_hash)) {
            isValid = true;
            userId = userRow.id;
            matchedUser = userRow.username;
          }
        }
      } catch (e) {
        console.warn('DB login query error:', e.message);
      }
    }

    if (!isValid) {
      if (username.trim().toLowerCase() === DEFAULT_ADMIN_USER.toLowerCase()) {
        if (comparePassword(password, storedAdminPassHash)) {
          isValid = true;
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!jwt) {
      return res.status(500).json({ error: 'Authentication service configuration error' });
    }

    const token = jwt.sign(
      { userId, username: matchedUser, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        username: matchedUser,
        role: 'admin'
      }
    });

  } catch (err) {
    console.error('Login Endpoint Error:', err);
    return res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    authenticated: true,
    user: req.user
  });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const newHash = hashPassword(newPassword.trim());
    storedAdminPassHash = newHash;

    if (db.isDbConnected()) {
      try {
        await db.query(
          'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($3)',
          [newHash, req.user.userId || 'admin-1', req.user.username || 'admin']
        );
      } catch (e) {
        console.warn('DB password update error:', e.message);
      }
    }

    return res.json({ success: true, message: 'Admin password updated successfully' });

  } catch (err) {
    console.error('Change Password Error:', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
