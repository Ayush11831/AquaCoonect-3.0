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
    role VARCHAR(20) DEFAULT 'citizen' CONSTRAINT chk_users_role CHECK (role IN ('citizen', 'officer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_type VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    image_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CONSTRAINT chk_complaints_status CHECK (status IN ('pending', 'in_progress', 'resolved')),
    priority_score INTEGER CONSTRAINT chk_complaints_priority_score CHECK (priority_score BETWEEN 1 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints (user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON complaints (issue_type);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON complaints;
CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_taken TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responses_complaint_id ON responses (complaint_id);

CREATE TABLE IF NOT EXISTS environmental_data (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
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

const MIGRATIONS = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('citizen', 'officer', 'admin'));

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS chk_complaints_status;
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_status CHECK (status IN ('pending', 'in_progress', 'resolved'));

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS chk_complaints_priority_score;
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_priority_score CHECK (priority_score BETWEEN 1 AND 100);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON complaints(issue_type);
CREATE INDEX IF NOT EXISTS idx_responses_complaint_id ON responses(complaint_id);
`;

async function ensureSchema() {
    await pool.query(SCHEMA);
    await pool.query(MIGRATIONS);
}

module.exports = { ensureSchema };
