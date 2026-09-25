const tripRepository = require("./trip.repository");

const pool = require("../../database/db");

const AppError = require("../../utils/AppError");

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

    // Check driver owns this pool

    const activePool = await tripRepository.findPoolByDriverWithLock(
      client,
      poolId,
      driverId,
    );

    if (!activePool) {
      throw new AppError("Pool not found or unauthorized", 403);
    }

    const rides = await tripRepository.arriveTrip(client, poolId);

    if (!rides.length) {
      throw new AppError("No matched rides found", 404);
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

    // Check driver owns pool

    const activePool = await tripRepository.findPoolByDriverWithLock(
      client,
      poolId,
      driverId,
    );

    if (!activePool) {
      throw new AppError("Pool not found or unauthorized", 403);
    }

    const rides = await tripRepository.startTrip(client, poolId);

    if (!rides.length) {
      throw new AppError("No arrived rides found", 404);
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

    // Check driver owns pool

    const activePool = await tripRepository.findPoolByDriverWithLock(
      client,
      poolId,
      driverId,
    );

    if (!activePool) {
      throw new AppError("Pool not found or unauthorized", 403);
    }

    const rides = await tripRepository.completeTrip(client, poolId);

    if (!rides.length) {
      throw new AppError("No ongoing rides found", 404);
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
