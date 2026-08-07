// backend/src/middleware/upload.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const config = require('../config/config');

const uploadDir = path.resolve(process.cwd(), config.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`);
    },
});

function imageFilter(req, file, cb) {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
}

const upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: config.maxImageCount },
});

module.exports = { upload };
