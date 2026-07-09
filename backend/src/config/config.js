// backend/src/config/config.js
require('dotenv').config();

// Render injects service hostnames without a scheme; local/Docker use full URLs.
// Normalize so downstream code can always treat ML_SERVICE_URL as an absolute URL.
function normalizeUrl(value, fallback) {
    const raw = value || fallback;
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3001,
    databaseUrl:
        process.env.DATABASE_URL ||
        'postgres://admin:secure_password@localhost:5432/aquaconnect',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    mlServiceUrl: normalizeUrl(process.env.ML_SERVICE_URL, 'http://localhost:5000'),
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxImageCount: 5,
};
