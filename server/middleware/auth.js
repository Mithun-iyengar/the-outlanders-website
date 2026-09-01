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

  try {
    if (!jwt) {
      throw new Error('JWT library unavailable');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
