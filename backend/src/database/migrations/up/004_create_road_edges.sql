CREATE TABLE road_edges (

    id SERIAL PRIMARY KEY,

    from_location_id INTEGER NOT NULL,

    to_location_id INTEGER NOT NULL,

    distance_km DECIMAL(5,2) NOT NULL,

    estimated_time INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(from_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE,


    FOREIGN KEY(to_location_id)
        REFERENCES locations(id)
        ON DELETE CASCADE

);