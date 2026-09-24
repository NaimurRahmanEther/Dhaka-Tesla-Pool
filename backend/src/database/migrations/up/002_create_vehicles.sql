CREATE TYPE vehicle_status AS ENUM (
    'ONLINE',
    'OFFLINE'
);


CREATE TABLE vehicles (

    id SERIAL PRIMARY KEY,

    driver_id INTEGER NOT NULL,

    name VARCHAR(100) NOT NULL,

    capacity INTEGER NOT NULL,

    status vehicle_status DEFAULT 'OFFLINE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);