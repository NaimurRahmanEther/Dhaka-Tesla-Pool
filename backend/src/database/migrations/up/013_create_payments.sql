CREATE TYPE payment_method AS ENUM (

    'CASH',

    'TESLA_WALLET'

);



CREATE TYPE payment_status AS ENUM (

    'PENDING',

    'PAID',

    'FAILED'

);




CREATE TABLE payments (

    id SERIAL PRIMARY KEY,


    ride_id INTEGER NOT NULL,


    passenger_id INTEGER NOT NULL,


    amount INTEGER NOT NULL,


    method payment_method DEFAULT 'CASH',


    status payment_status DEFAULT 'PENDING',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(ride_id)
    REFERENCES rides(id)
    ON DELETE CASCADE,


    FOREIGN KEY(passenger_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);