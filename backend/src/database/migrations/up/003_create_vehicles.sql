CREATE TYPE vehicle_status AS ENUM (
    'ONLINE',
    'OFFLINE'
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL CHECK(capacity>0),
    status vehicle_status DEFAULT 'OFFLINE',
    current_location_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY(current_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE
);
