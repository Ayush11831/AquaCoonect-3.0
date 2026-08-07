// backend/src/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { ensureSchema } = require('./config/initDb');
const { healthCheck, close } = require('./config/database');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');

const app = express();

app.use(helmet());
app.use(morgan(config.nodeEnv === 'production' ? 'short' : 'dev'));

const corsOptions = config.corsOrigins === '*' 
  ? {} 
  : { origin: config.corsOrigins.split(',').map(s => s.trim()) };
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded complaint photos.
app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));

app.get('/health', async (req, res) => {
    const dbHealthy = await healthCheck();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'degraded',
        service: 'aquaconnect-api',
        db: dbHealthy ? 'connected' : 'disconnected',
        uptime: process.uptime(),
    });
});

app.use('/api/complaints', complaintRoutes);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/users', authLimiter, userRoutes);

// Central error handler (e.g. multer file-size/type rejections).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ success: false, error: err.message });
});

if (require.main === module) {
    // Ensure the schema exists, then start listening regardless — so the
    // health check passes even if the DB is briefly unavailable at boot.
    ensureSchema()
        .then(() => console.log('Database schema ensured'))
        .catch((err) => console.error('Schema init failed (continuing):', err.message))
        .finally(() => {
            const server = app.listen(config.port, () => {
                console.log(`AquaConnect API listening on port ${config.port}`);
            });

            const gracefulShutdown = (signal) => {
                console.log(`\n${signal} received. Shutting down gracefully...`);
                server.close(async () => {
                    await close();
                    console.log('Server closed. Database pool drained.');
                    process.exit(0);
                });
                setTimeout(() => {
                    console.error('Forced shutdown after timeout.');
                    process.exit(1);
                }, 10000);
            };
            process.on('SIGTERM', gracefulShutdown);
            process.on('SIGINT', gracefulShutdown);
        });
}

module.exports = app;
