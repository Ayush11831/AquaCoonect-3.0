// backend/src/config/initDb.js
// Idempotently ensures the schema exists at startup. Managed Postgres hosts
// (e.g. Render) don't run database/init.sql automatically the way the local
// docker-compose Postgres does, so the API creates its own tables on boot.
// Keep this in sync with database/init.sql (the canonical local schema).
const { pool } = require('./database');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    issue_type VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    image_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    priority_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);

CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    officer_id INTEGER REFERENCES users(id),
    action_taken TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environmental_data (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    soil_type VARCHAR(50),
    rainfall_mm DECIMAL(5,2),
    wind_speed_kmh DECIMAL(5,2),
    temperature_c DECIMAL(4,2),
    humidity_percent DECIMAL(4,2),
    elevation_m DECIMAL(7,2),
    proximity_to_water_bodies_m INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function ensureSchema() {
    await pool.query(SCHEMA);
}

module.exports = { ensureSchema };
