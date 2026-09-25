const pool = require("../../database/db");

// Get driver's active pool with passengers

const findActivePoolByDriverId = async (driverId) => {
  const result = await pool.query(
    `
        SELECT

            pools.id AS pool_id,

            pools.status AS pool_status,


            vehicles.id AS vehicle_id,

            vehicles.model,

            vehicles.capacity,


            users.name AS passenger_name,

            rides.id AS ride_id,

            rides.status AS ride_status,


            pickup.name AS pickup_location,

            destination.name AS destination_location,


            pool_rides.seats_allocated



        FROM pools


        JOIN vehicles

        ON pools.vehicle_id = vehicles.id



        JOIN pool_rides

        ON pools.id = pool_rides.pool_id



        JOIN rides

        ON pool_rides.ride_id = rides.id



        JOIN users

        ON rides.passenger_id = users.id



        JOIN locations pickup

        ON rides.pickup_location_id = pickup.id



        JOIN locations destination

        ON rides.destination_location_id = destination.id



        WHERE pools.driver_id=$1

        AND pools.status='ACTIVE'


        ORDER BY rides.requested_at ASC

        `,

    [driverId],
  );

  return result.rows;
};

module.exports = {
  findActivePoolByDriverId,
};
