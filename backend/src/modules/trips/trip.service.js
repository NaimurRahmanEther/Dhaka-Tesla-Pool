const tripRepository = require("./trip.repository");

const pool = require("../../database/db");

const AppError = require("../../utils/AppError");
const graphService = require("../graph/graph.service");

// Check out a pool for a driver-side action. Ownership and state are answered
// separately, so a completed own pool is a 409 and not a 403.
const lockOwnedActivePool = async (client, poolId, driverId) => {
  const found = await tripRepository.findPoolWithLock(client, poolId);

  if (!found) {
    throw new AppError("Pool not found", 404);
  }

  if (found.driver_id !== driverId) {
    throw new AppError("You cannot operate on this pool", 403);
  }

  if (found.status !== "ACTIVE") {
    throw new AppError(
      `This trip is already ${found.status.toLowerCase()}, it cannot be changed`,
      409,
    );
  }

  return found;
};

// Driver view active trip

const getActiveTrip = async (driverId) => {
  const trips = await tripRepository.findActivePoolByDriverId(driverId);

  if (!trips.length) {
    throw new AppError("No active trip found", 404);
  }

  return trips;
};

// Driver arrived

const arriveTrip = async (poolId, driverId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await lockOwnedActivePool(client, poolId, driverId);

    const rides = await tripRepository.arriveTrip(client, poolId);

    if (!rides.length) {
      // The rides are not in a state that can arrive yet, so this is a state
      // conflict and must not be reported as 404.
      throw new AppError(
        "No matched rides to arrive, rides must be MATCHED first",
        409,
      );
    }

    for (const ride of rides) {
      await tripRepository.createRideHistory(client, {
        rideId: ride.id,
        actorId: driverId,
        action: "DRIVER_ARRIVED",
      });
    }

    await client.query("COMMIT");

    return rides;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

// Start trip

const startTrip = async (poolId, driverId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await lockOwnedActivePool(client, poolId, driverId);

    const rides = await tripRepository.startTrip(client, poolId);

    if (!rides.length) {
      // Starting before arriving skips a lifecycle stage. Reported as a
      // conflict so the driver is told which step is missing.
      throw new AppError(
        "Trip cannot start yet, the driver must arrive first",
        409,
      );
    }

    for (const ride of rides) {
      await tripRepository.createRideHistory(client, {
        rideId: ride.id,
        actorId: driverId,
        action: "STARTED",
      });
    }

    await client.query("COMMIT");

    return rides;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

// Complete trip

const completeTrip = async (poolId, driverId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await lockOwnedActivePool(client, poolId, driverId);

    const waiting = await client.query(
      `SELECT 1 FROM rides JOIN pool_rides ON pool_rides.ride_id=rides.id
       WHERE pool_rides.pool_id=$1 AND rides.status IN ('MATCHED','DRIVER_ARRIVED')`, [poolId],
    );
    if (waiting.rows.length) throw new AppError("Pick up or cancel waiting passengers before completing the trip", 409);
    const rides = await tripRepository.completeTrip(client, poolId);

    if (!rides.length) {
      // Only completes a pool that is under way, and also catches a second
      // completion, since the rides have left ONGOING.
      throw new AppError(
        "Trip cannot complete, it has not started or is already completed",
        409,
      );
    }

    for (const ride of rides) {
      await tripRepository.createRideHistory(client, {
        rideId: ride.id,
        actorId: driverId,
        action: "COMPLETED",
      });
    }

    const completedPool = await tripRepository.completePool(client, poolId);

    await client.query("COMMIT");

    return {
      rides,
      pool: completedPool,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

const cancelTrip = async (poolId, driverId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await lockOwnedActivePool(client, poolId, driverId);
    const { rows } = await client.query(
      `SELECT rides.* FROM rides JOIN pool_rides ON pool_rides.ride_id=rides.id
       WHERE pool_rides.pool_id=$1 ORDER BY rides.id FOR UPDATE OF rides`,
      [poolId],
    );
    if (rows.some((ride) => !["CANCELLED", "COMPLETED"].includes(ride.status))) {
      throw new AppError("Cancel individual waiting rides first. Only an empty pool can be closed", 409);
    }
    const closed = await client.query(
      "UPDATE pools SET status='CANCELLED' WHERE id=$1 RETURNING *", [poolId],
    );
    await client.query("COMMIT");
    return { rides: [], pool: closed.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updatePassenger = async (poolId, rideId, driverId, action) => {
  if (!["arrive", "start", "cancel"].includes(action)) {
    throw new AppError("Invalid passenger action", 400);
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const activePool = await lockOwnedActivePool(client, poolId, driverId);
    const found = await client.query(
      `SELECT rides.* FROM rides JOIN pool_rides ON pool_rides.ride_id=rides.id
       WHERE pool_rides.pool_id=$1 AND rides.id=$2 FOR UPDATE OF rides`, [poolId, rideId],
    );
    const ride = found.rows[0];
    if (!ride) throw new AppError("Passenger ride not found in this pool", 404);
    const expected = action === "start" ? "DRIVER_ARRIVED" : "MATCHED";
    if (ride.status !== expected || (action === "cancel" && ride.arrived_at)) {
      throw new AppError(action === "cancel" ? "This passenger's ride can only be cancelled before arrival" : "This passenger is not ready for this action", 409);
    }
    const changes = {
      arrive: "status='DRIVER_ARRIVED', arrived_at=CURRENT_TIMESTAMP",
      start: "status='ONGOING', started_at=CURRENT_TIMESTAMP",
      cancel: "status='CANCELLED', cancelled_at=CURRENT_TIMESTAMP",
    };
    const result = await client.query("UPDATE rides SET " + changes[action] + " WHERE id=$1 RETURNING *", [rideId]);
    if (action === "cancel") {
      await client.query("DELETE FROM pool_rides WHERE pool_id=$1 AND ride_id=$2", [poolId, rideId]);
      const remaining = await client.query(
        `SELECT pickup_location_id, destination_location_id FROM rides
         JOIN pool_rides ON pool_rides.ride_id=rides.id WHERE pool_rides.pool_id=$1`, [poolId],
      );
      const stops = new Set(remaining.rows.flatMap((r) => [r.pickup_location_id, r.destination_location_id]));
      const path = (activePool.current_route?.path ?? []).filter((stop, i) => i === 0 || stops.has(stop));
      const route = remaining.rows.length ? { path, distance: await graphService.calculateRouteDistance(path) } : null;
      await client.query("UPDATE pools SET current_route=$1, route_updated_at=CURRENT_TIMESTAMP WHERE id=$2", [route ? JSON.stringify(route) : null, poolId]);
    }
    await tripRepository.createRideHistory(client, {
      rideId, actorId: driverId, action: { arrive: "DRIVER_ARRIVED", start: "STARTED", cancel: "CANCELLED" }[action],
    });
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  updatePassenger,
  cancelTrip,
  getActiveTrip,
  arriveTrip,
  startTrip,
  completeTrip,
};
