-- database/init.sql
-- Schema + seed data for AquaConnect. Loaded automatically by the postgres
-- container on first start (mounted into /docker-entrypoint-initdb.d/).

-- Users (citizens + government officers)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'citizen',          -- citizen | officer | admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    issue_type VARCHAR(50),                      -- pipe_breakage | water_leakage | water_logging | contamination | low_pressure
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    image_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending',        -- pending | in_progress | resolved
    priority_score INTEGER,                      -- 1-100 from the ML model
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);

-- Government responses
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    officer_id INTEGER REFERENCES users(id),
    action_taken TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environmental factors (captured per complaint for ML training)
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

-- Minimal seed data so the dashboard isn't empty on first run.
INSERT INTO users (username, email, phone, role)
VALUES
    ('demo_citizen', 'citizen@example.com', '9990000001', 'citizen'),
    ('bmc_officer',  'officer@example.com', '9990000002', 'officer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO complaints (user_id, title, description, issue_type, latitude, longitude, address, status, priority_score)
VALUES
    (1, 'Sewage overflow near Upper Lake', 'Contaminated water pooling on the road', 'contamination', 23.2560, 77.3560, 'VIP Road, Bhopal', 'pending', 92),
    (1, 'Burst pipeline in Old City', 'Main line broken, road flooding', 'pipe_breakage', 23.2657, 77.4020, 'Chowk, Old City', 'in_progress', 78),
    (1, 'Water logging in TT Nagar', 'Knee-deep water after rain', 'water_logging', 23.2330, 77.4010, 'TT Nagar', 'pending', 71)
ON CONFLICT DO NOTHING;
