CREATE TABLE pool_members (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL,
    ride_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    seats_booked INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    destination_location_id INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(pool_id)
        REFERENCES pools(id)
        ON DELETE CASCADE,
    FOREIGN KEY(ride_id)
        REFERENCES rides(id)
        ON DELETE CASCADE,
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
