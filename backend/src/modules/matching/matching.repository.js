const pool = require("../../database/db");

const AppError = require("../../utils/AppError");

// Find available Tesla vehicles

const findAvailableVehicles = async () => {
  const result = await pool.query(
    `
      SELECT
          vehicles.id AS vehicle_id,
          vehicles.capacity,
          vehicles.driver_id,
          vehicles.current_location_id,
          users.name AS driver_name
      FROM vehicles
      JOIN users
      ON vehicles.driver_id = users.id
      WHERE vehicles.status='ONLINE'
      AND users.role='DRIVER'
    `,
  );

  return result.rows;
};

// One Tesla per driver, so this returns the vehicle itself.
const findVehicleByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT
          vehicles.id AS vehicle_id,
          vehicles.capacity,
          vehicles.driver_id,
          vehicles.current_location_id,
          vehicles.status,
          users.name AS driver_name
      FROM vehicles
      JOIN users
      ON vehicles.driver_id = users.id
      WHERE vehicles.driver_id=$1
    `,
    [driverId],
  );

  return result.rows[0];
};

// Rides still waiting for a driver, oldest first so nobody is starved.
const findOpenRequests = async () => {
  const result = await pool.query(
    `
      SELECT
          rides.id,
          rides.passenger_id,
          rides.pickup_location_id,
          rides.destination_location_id,
          rides.seats_requested,
          rides.requested_at,
          pickup.name AS pickup_location,
          destination.name AS destination_location,
          users.name AS passenger_name
      FROM rides
      JOIN locations pickup
      ON rides.pickup_location_id = pickup.id
      JOIN locations destination
      ON rides.destination_location_id = destination.id
      JOIN users
      ON rides.passenger_id = users.id
      WHERE rides.status='REQUESTED'
      ORDER BY rides.requested_at ASC
    `,
  );

  return result.rows;
};

// Find active pool of vehicle

const findActivePoolByVehicleId = async (vehicleId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM pools
      WHERE vehicle_id=$1
      AND status='ACTIVE'
    `,
    [vehicleId],
  );

  return result.rows[0];
};

// Get rides already inside pool

const getPoolRides = async (poolId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM pool_rides
      WHERE pool_id=$1
    `,
    [poolId],
  );

  return result.rows;
};

// Update ride fare

const updateRideFare = async (rideId, fare, fareBreakdown = null) => {
  const result = await pool.query(
    `
      UPDATE rides
      SET
          fare=$1,
          fare_breakdown=$2
      WHERE id=$3
      RETURNING *
    `,
    [fare, fareBreakdown ? JSON.stringify(fareBreakdown) : null, rideId],
  );

  return result.rows[0];
};

// Assign ride to pool. The authoritative capacity gate: the vehicle row is locked
// first, so a race for the last seat is serialised and the loser is rejected.
const assignRideToPool = async ({
  vehicleId,
  driverId,
  rideId,
  seatsAllocated,
  route,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vehicleResult = await client.query(
      `
        SELECT *
        FROM vehicles
        WHERE id=$1
        FOR UPDATE
      `,
      [vehicleId],
    );

    if (!vehicleResult.rows.length) {
      throw new AppError("Vehicle not found", 404);
    }

    const vehicle = vehicleResult.rows[0];

    const poolResult = await client.query(
      `
        SELECT *
        FROM pools
        WHERE vehicle_id=$1
        AND status='ACTIVE'
        FOR UPDATE
      `,
      [vehicleId],
    );

    let activePool = poolResult.rows[0];

    if (!activePool) {
      const newPool = await client.query(
        `
          INSERT INTO pools
          (
              vehicle_id,
              driver_id,
              status,
              capacity,
              current_route
          )
          VALUES
          (
              $1,
              $2,
              'ACTIVE',
              $3,
              $4
          )
          RETURNING *
        `,
        [vehicleId, driverId, vehicle.capacity, JSON.stringify(route)],
      );

      activePool = newPool.rows[0];
    }

    // Re-check under the lock. `pools.capacity` is the snapshot from when the pool
    // opened, so this also catches a Tesla resized since.
    const occupiedResult = await client.query(
      `
        SELECT COALESCE(SUM(seats_allocated), 0) AS occupied
        FROM pool_rides
        WHERE pool_id=$1
      `,
      [activePool.id],
    );

    const occupiedSeats = Number(occupiedResult.rows[0].occupied);
    const availableSeats = activePool.capacity - occupiedSeats;

    if (availableSeats < seatsAllocated) {
      throw new AppError(
        `Not enough seats available: ${availableSeats} left, ${seatsAllocated} requested`,
        409,
        "NO_SEAT_AVAILABLE",
      );
    }

    const poolRide = await client.query(
      `
        INSERT INTO pool_rides
        (
            pool_id,
            ride_id,
            seats_allocated
        )
        VALUES
        (
            $1,
            $2,
            $3
        )
        RETURNING *
      `,
      [activePool.id, rideId, seatsAllocated],
    );

    // Keep the pool's route in step with the stops it now has to serve.
    const updatedPool = await client.query(
      `
        UPDATE pools
        SET
            current_route=$1,
            route_updated_at=CURRENT_TIMESTAMP
        WHERE id=$2
        RETURNING *
      `,
      [JSON.stringify(route), activePool.id],
    );

    const updatedRide = await client.query(
      `
        UPDATE rides
        SET
            status='MATCHED',
            matched_at=CURRENT_TIMESTAMP
        WHERE id=$1
        RETURNING *
      `,
      [rideId],
    );

    // Record the acceptance so the audit trail covers the whole lifecycle
    // rather than starting at DRIVER_ARRIVED.
    await client.query(
      `
        INSERT INTO ride_history (ride_id, actor_id, action)
        VALUES($1,$2,'ACCEPTED')
      `,
      [rideId, driverId],
    );

    await client.query("COMMIT");

    return {
      pool: updatedPool.rows[0],
      poolRide: poolRide.rows[0],
      ride: updatedRide.rows[0],
      availableSeats: availableSeats - seatsAllocated,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findAvailableVehicles,
  findVehicleByDriverId,
  findOpenRequests,
  findActivePoolByVehicleId,
  getPoolRides,
  updateRideFare,
  assignRideToPool,
};
