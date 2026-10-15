require('dotenv').config();
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const config = Object.freeze({
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maxUploadBytes: Math.max(1, Number(process.env.MAX_UPLOAD_MB || 5)) * 1024 * 1024,
  dataDir: path.join(ROOT, 'data'),
  uploadDir: path.join(ROOT, 'uploads')
});
module.exports = config;
