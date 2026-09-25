CREATE TABLE driver_routes (

    id SERIAL PRIMARY KEY,


    driver_id INTEGER NOT NULL,


    start_location_id INTEGER NOT NULL,


    destination_location_id INTEGER NOT NULL,


    route JSONB NOT NULL,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,


    FOREIGN KEY(start_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,


    FOREIGN KEY(destination_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE

);