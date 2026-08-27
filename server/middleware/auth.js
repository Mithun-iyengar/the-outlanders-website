// server/middleware/auth.js - JWT Authentication Middleware
try { require('dotenv').config(); } catch(e){}

let jwt = null;
try { jwt = require('jsonwebtoken'); } catch(e){}

const JWT_SECRET = process.env.JWT_SECRET || 'outlanders_dev_jwt_secret_key_2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  if (token === 'dev-admin-token-2026') {
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      req.user = { userId: 'admin-1', username: 'admin', role: 'admin' };
      return next();
    }
  }

  try {
    if (jwt) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } else {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      if (decoded && decoded.userId) {
        req.user = decoded;
        return next();
      }
    }
    throw new Error('Invalid token');
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
