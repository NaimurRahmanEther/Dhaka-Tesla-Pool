CREATE TABLE pool_rides (

    id SERIAL PRIMARY KEY,


    pool_id INTEGER NOT NULL,


    ride_id INTEGER NOT NULL,


    seats_allocated INTEGER NOT NULL CHECK(seats_allocated > 0),


    pickup_order INTEGER,


    dropOff_order INTEGER,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(pool_id)

        REFERENCES pools(id)

        ON DELETE CASCADE,


    FOREIGN KEY(ride_id)

        REFERENCES rides(id)

        ON DELETE CASCADE,


    UNIQUE(pool_id, ride_id)

);