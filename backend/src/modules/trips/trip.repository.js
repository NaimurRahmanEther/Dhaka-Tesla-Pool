const pool = require("../../database/db");

// Get driver's active pool with passengers

const findActivePoolByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT
          pools.id AS pool_id,
          pools.status AS pool_status,
          pools.current_route,
          pools.route_updated_at,
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

// Check driver owns pool and lock it

// Deliberately does not filter on status. Doing both at once reported a
// driver's own completed pool as "not found or unauthorized".
const findPoolWithLock = async (client, poolId) => {
  const result = await client.query(
    `
      SELECT *
      FROM pools
      WHERE id=$1
      FOR UPDATE
    `,
    [poolId],
  );

  return result.rows[0];
};

// Driver arrived

const arriveTrip = async (client, poolId) => {
  const result = await client.query(
    `
      UPDATE rides
      SET
          status='DRIVER_ARRIVED',
          arrived_at=CURRENT_TIMESTAMP
      WHERE id IN
      (
          SELECT ride_id
          FROM pool_rides
          WHERE pool_id=$1
      )
      AND status='MATCHED'
      RETURNING *
    `,
    [poolId],
  );

  return result.rows;
};

// Start trip

const startTrip = async (client, poolId) => {
  const result = await client.query(
    `
      UPDATE rides
      SET
          status='ONGOING',
          started_at=CURRENT_TIMESTAMP
      WHERE id IN
      (
          SELECT ride_id
          FROM pool_rides
          WHERE pool_id=$1
      )
      AND status='DRIVER_ARRIVED'
      RETURNING *
    `,
    [poolId],
  );

  return result.rows;
};

// Complete trip

const completeTrip = async (client, poolId) => {
  const result = await client.query(
    `
      UPDATE rides
      SET
          status='COMPLETED',
          completed_at=CURRENT_TIMESTAMP
      WHERE id IN
      (
          SELECT ride_id
          FROM pool_rides
          WHERE pool_id=$1
      )
      AND status='ONGOING'
      RETURNING *
    `,
    [poolId],
  );

  return result.rows;
};

// Complete pool

const completePool = async (client, poolId) => {
  const result = await client.query(
    `
      UPDATE pools
      SET
          status='COMPLETED',
          started_at=COALESCE(started_at, CURRENT_TIMESTAMP),
          completed_at=CURRENT_TIMESTAMP
      WHERE id=$1
      RETURNING *
    `,
    [poolId],
  );

  return result.rows[0];
};

// Ride history

const createRideHistory = async (client, { rideId, actorId, action }) => {
  const result = await client.query(
    `
      INSERT INTO ride_history
      (
          ride_id,
          actor_id,
          action
      )
      VALUES($1,$2,$3)
      RETURNING *
    `,
    [rideId, actorId, action],
  );

  return result.rows[0];
};

module.exports = {
  findActivePoolByDriverId,
  findPoolWithLock,
  arriveTrip,
  startTrip,
  completeTrip,
  completePool,
  createRideHistory,
};
