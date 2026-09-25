const pool = require("../../database/db");

// Passenger ride history

const findPassengerHistory = async (passengerId) => {
  const result = await pool.query(
    `
      SELECT
          rides.id AS ride_id,
          rides.status,
          rides.fare,
          rides.requested_at,
          rides.completed_at,
          pickup.name AS pickup_location,
          destination.name AS destination_location
      FROM rides
      JOIN locations pickup
      ON rides.pickup_location_id = pickup.id
      JOIN locations destination
      ON rides.destination_location_id = destination.id
      WHERE rides.passenger_id=$1
      ORDER BY rides.requested_at DESC
    `,
    [passengerId],
  );

  return result.rows;
};

// Driver trip history

const findDriverHistory = async (driverId) => {
  const result = await pool.query(
    `
      SELECT
          pools.id AS pool_id,
          pools.completed_at,
          vehicles.model,
          vehicles.id AS vehicle_id,
          rides.id AS ride_id,
          rides.status,
          rides.fare,
          rides.completed_at AS ride_completed_at,
          users.name AS passenger_name,
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
      AND pools.status='COMPLETED'
      ORDER BY pools.completed_at DESC
    `,
    [driverId],
  );

  return result.rows;
};

module.exports = {
  findPassengerHistory,
  findDriverHistory,
};
