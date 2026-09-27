CREATE TYPE pool_status AS ENUM (
    'CREATED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE pools (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    status pool_status DEFAULT 'CREATED',
    -- A snapshot of the Tesla's capacity taken when the pool opened. Every
    -- pool is created from a real vehicle, so this is never unknown.
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    current_route JSONB,
    route_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY(vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE CASCADE,
    FOREIGN KEY(driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
