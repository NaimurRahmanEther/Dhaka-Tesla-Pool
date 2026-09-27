const pool = require("../../database/db");

// Find active pool and lock row. Both tables have `capacity`, so both are
// aliased - `SELECT *` returned one of the two at random.

const findActivePoolWithLock = async (client, poolId) => {
  const result = await client.query(
    `
      SELECT
          pools.id,
          pools.vehicle_id,
          pools.driver_id,
          pools.status,
          pools.capacity AS pool_capacity,
          vehicles.capacity AS vehicle_capacity,
          vehicles.model,
          pools.current_route,
          pools.route_updated_at
      FROM pools
      JOIN vehicles
      ON pools.vehicle_id = vehicles.id
      WHERE pools.id=$1
      AND pools.status='ACTIVE'
      FOR UPDATE OF pools
    `,
    [poolId],
  );

  return result.rows[0];
};

// Calculate occupied seats

const getOccupiedSeats = async (client, poolId) => {
  const result = await client.query(
    `
      SELECT
      COALESCE(
          SUM(seats_allocated),
          0
      ) AS occupied
      FROM pool_rides
      WHERE pool_id=$1
    `,
    [poolId],
  );

  return Number(result.rows[0].occupied);
};

// Add passenger ride into pool

const addRideToPool = async (client, { poolId, rideId, seatsAllocated }) => {
  const result = await client.query(
    `
      INSERT INTO pool_rides
      (
          pool_id,
          ride_id,
          seats_allocated
      )
      VALUES($1,$2,$3)
      RETURNING *
    `,
    [poolId, rideId, seatsAllocated],
  );

  return result.rows[0];
};

// Update optimized pool route

const updatePoolRoute = async (client, { poolId, route }) => {
  const result = await client.query(
    `
      UPDATE pools
      SET
          current_route=$1,
          route_updated_at=CURRENT_TIMESTAMP
      WHERE id=$2
      RETURNING *
    `,
    [JSON.stringify(route), poolId],
  );

  return result.rows[0];
};

// Record the fare and the MATCHED move together, so a ride is never pooled
// without the fare that was charged for it.
const confirmRideInPool = async (
  client,
  { rideId, fare, fareBreakdown = null },
) => {
  const result = await client.query(
    `
      UPDATE rides
      SET
          fare=$1,
          fare_breakdown=$2,
          status='MATCHED',
          matched_at=CURRENT_TIMESTAMP
      WHERE id=$3
      RETURNING *
    `,
    [fare, fareBreakdown ? JSON.stringify(fareBreakdown) : null, rideId],
  );

  return result.rows[0];
};

// Find pool owner, used to authorise driver-scoped reads
const findPoolById = async (poolId) => {
  const result = await pool.query(
    `
      SELECT
          id,
          vehicle_id,
          driver_id,
          status
      FROM pools
      WHERE id=$1
    `,
    [poolId],
  );

  return result.rows[0];
};

// The Tesla behind a pool, for capacity and model.
const getPoolVehicle = async (poolId) => {
  const result = await pool.query(
    `
      SELECT
          vehicles.id,
          vehicles.model,
          vehicles.capacity
      FROM pools
      JOIN vehicles
      ON pools.vehicle_id = vehicles.id
      WHERE pools.id=$1
    `,
    [poolId],
  );

  return result.rows[0];
};

// Get pool passengers for driver view

const getPoolPassengers = async (poolId) => {
  const result = await pool.query(
    `
      SELECT
          pools.id AS pool_id,
          vehicles.model,
          vehicles.capacity,
          users.name AS passenger_name,
          rides.id AS ride_id,
          rides.status AS ride_status,
          rides.fare,
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
      WHERE pools.id=$1
      ORDER BY rides.requested_at ASC
    `,
    [poolId],
  );

  return result.rows;
};

module.exports = {
  findActivePoolWithLock,
  findPoolById,
  getPoolVehicle,
  getOccupiedSeats,
  addRideToPool,
  updatePoolRoute,
  confirmRideInPool,
  getPoolPassengers,
};
