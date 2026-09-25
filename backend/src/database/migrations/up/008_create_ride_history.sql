CREATE TYPE ride_action AS ENUM (
    'REQUESTED',
    'ACCEPTED',
    'DRIVER_ARRIVED',
    'STARTED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE ride_history (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL,
    actor_id INTEGER NOT NULL,
    action ride_action NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id)
        REFERENCES rides(id)
        ON DELETE CASCADE,
    FOREIGN KEY(actor_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
