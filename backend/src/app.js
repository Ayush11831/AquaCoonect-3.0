// backend/src/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded complaint photos.
app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'aquaconnect-api' }));

app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

// Central error handler (e.g. multer file-size/type rejections).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ success: false, error: err.message });
});

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`AquaConnect API listening on port ${config.port}`);
    });
}

module.exports = app;
