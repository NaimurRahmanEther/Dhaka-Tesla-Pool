CREATE TYPE ride_status AS ENUM (
    'REQUESTED',
    'MATCHED',
    'DRIVER_ARRIVED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

-- Money carries to the poisha, so `fare` is NUMERIC(10,2) to match
-- `payments.amount`. A shared trip's cost is split between riders and the exact
-- share is rarely a whole Taka, so an INTEGER would throw the fraction away.
-- NUMERIC rather than FLOAT: money must not sit in binary floating point, where
-- 39.38 has no exact representation. Migration 014 widens the same two columns
-- on databases created before this, and is a no-op on a fresh install.
-- `fare_breakdown` keeps the line items, and each stage has its own timestamp.
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    passenger_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    destination_location_id INTEGER NOT NULL,
    seats_requested INTEGER NOT NULL DEFAULT 1 CHECK (seats_requested > 0),
    fare NUMERIC(10, 2),
    fare_breakdown JSONB,
    status ride_status DEFAULT 'REQUESTED',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMP,
    arrived_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    CHECK (pickup_location_id <> destination_location_id),
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
