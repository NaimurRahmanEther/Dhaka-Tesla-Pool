CREATE TYPE ride_status AS ENUM (
    'REQUESTED',
    'MATCHED',
    'DRIVER_ARRIVED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    passenger_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    destination_location_id INTEGER NOT NULL,
    seats_requested INTEGER NOT NULL DEFAULT 1,
    fare DECIMAL(10,2),
    status ride_status DEFAULT 'REQUESTED',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY(passenger_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY(pickup_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,
    FOREIGN KEY(destination_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE
);
