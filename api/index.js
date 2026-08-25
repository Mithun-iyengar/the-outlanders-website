// api/index.js - Vercel Serverless Function Entry Point for Express CMS Server
const app = require('../server/server');

module.exports = (req, res) => {
  return app(req, res);
};
