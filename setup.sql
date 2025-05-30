-- setup.sql

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT 0
);

-- VEHICLE TYPES TABLE
CREATE TABLE IF NOT EXISTS vehicle_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    engine_id INTEGER UNIQUE NOT NULL
);

-- VEHICLE PARAMETERS TABLE (now with make, model, year)
CREATE TABLE IF NOT EXISTS vehicle_params (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_type_id INTEGER NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    param_string TEXT NOT NULL,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types (id)
);

-- COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_data TEXT,       -- Base64 encoded image data
    image_type TEXT,       -- MIME type of the image
    speed_profile TEXT NOT NULL,
    results TEXT DEFAULT '{}',  -- JSON object to store results for different vehicle types
    created_at TEXT NOT NULL,
    FOREIGN KEY (username) REFERENCES users (username)
);

-- METRICS TABLE
DROP TABLE IF EXISTS metrics;
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    label TEXT,
    unit TEXT,
    color TEXT,
    valueKey TEXT
);

INSERT OR IGNORE INTO metrics (id, label, unit, color, valueKey) VALUES 
  ('fuel_rate',         'Fuel Rate',          'L/s',    '#2a9d30',       'og_model'),
  ('fuel_economy',      'Fuel Economy',       'MPG',    '#7c51d9',       'og_model'),
  ('power',             'Power Output',       'kW',     '#2a9d8f',       'og_model'),
  ('energy_efficiency', 'Energy Efficiency',  'mi/kWh', '#ff2828',       'og_model'),
  ('particle_matter', 'Particle Matter', 'mg', '#2a9d30', 'pm_model');

-- INITIAL VEHICLE TYPES
INSERT OR IGNORE INTO vehicle_types (type_name, full_name, engine_id) VALUES 
  ('ICEV', 'Internal Combustion Engine Vehicle', 1),
  ('BEV',  'Battery Electric Vehicle',            3),
  ('HEV',  'Hybrid Electric Vehicle',             6),
  ('HFCV', 'Hydrogen Fuel Cell Vehicle',          7);
