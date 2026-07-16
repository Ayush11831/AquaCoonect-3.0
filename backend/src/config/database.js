// backend/src/config/database.js
const { Pool } = require('pg');
const config = require('./config');

// A single shared connection pool for the whole process.
const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    // A broken idle client should not crash the whole API.
    console.error('Unexpected Postgres pool error:', err.message);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
};
