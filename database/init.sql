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
    role VARCHAR(20) DEFAULT 'citizen' CONSTRAINT chk_users_role CHECK (role IN ('citizen', 'officer', 'admin')),          -- citizen | officer | admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_type VARCHAR(50) NOT NULL,                      -- pipe_breakage | water_leakage | water_logging | contamination | low_pressure
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    image_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CONSTRAINT chk_complaints_status CHECK (status IN ('pending', 'in_progress', 'resolved')),        -- pending | in_progress | resolved
    priority_score INTEGER CONSTRAINT chk_complaints_priority_score CHECK (priority_score BETWEEN 1 AND 100),                      -- 1-100 from the ML model
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

-- Government responses
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_taken TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responses_complaint_id ON responses (complaint_id);

-- Environmental factors (captured per complaint for ML training)
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
