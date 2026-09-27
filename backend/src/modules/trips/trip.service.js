const tripRepository = require("./trip.repository");

const pool = require("../../database/db");

const AppError = require("../../utils/AppError");

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

module.exports = {
  getActiveTrip,
  arriveTrip,
  startTrip,
  completeTrip,
};
