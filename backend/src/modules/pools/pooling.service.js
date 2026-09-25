const pool = require("../../database/db");

const poolingRepository = require("./pooling.repository");

const { findBestRoute, isDetourAcceptable } = require("./pooling.algorithm");

const graphService = require("../graph/graph.service");

const fareService = require("../fare/fare.service");

const AppError = require("../../utils/AppError");

const addPassengerToPool = async ({ poolId, ride }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const activePool = await poolingRepository.findActivePoolWithLock(
      client,
      poolId,
    );

    if (!activePool) {
      throw new AppError("Active pool not found", 404);
    }

    const occupiedSeats = await poolingRepository.getOccupiedSeats(
      client,
      poolId,
    );

    const availableSeats = activePool.capacity - occupiedSeats;

    if (availableSeats < ride.seats_requested) {
      throw new AppError("Not enough seats available", 400);
    }

    if (!activePool.current_route) {
      throw new AppError("Pool route not found", 400);
    }

    const currentRoute = activePool.current_route;

    const bestRoute = await findBestRoute({
      currentRoute: currentRoute.path,
      pickup: ride.pickup_location_id,
      destination: ride.destination_location_id,
    });

    if (!bestRoute) {
      throw new AppError("No possible route found", 400);
    }

    const acceptable = isDetourAcceptable(
      currentRoute.distance,
      bestRoute.distance,
    );

    if (!acceptable) {
      throw new AppError("Passenger creates too much detour", 400);
    }

    const passengerDistance = await graphService.calculateRouteDistance([
      ride.pickup_location_id,
      ride.destination_location_id,
    ]);

    const fareResult = await fareService.calculateRideFare({
      distance: passengerDistance,
      isPool: true,
    });

    const poolRide = await poolingRepository.addRideToPool(client, {
      poolId,
      rideId: ride.id,
      seatsAllocated: ride.seats_requested,
    });

    const updatedPool = await poolingRepository.updatePoolRoute(client, {
      poolId,
      route: {
        path: bestRoute.route,
        distance: bestRoute.distance,
      },
    });

    await poolingRepository.updateRideFare(client, {
      rideId: ride.id,
      fare: fareResult.fare,
    });

    const updatedRide = await client.query(
      `
        UPDATE rides
        SET status='MATCHED'
        WHERE id=$1
        RETURNING *
      `,
      [ride.id],
    );

    await client.query("COMMIT");

    return {
      poolRide,
      pool: updatedPool,
      ride: updatedRide.rows[0],
      fare: fareResult.fare,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

// Get passengers inside pool

const getPoolPassengers = async (poolId) => {
  const passengers = await poolingRepository.getPoolPassengers(poolId);

  if (!passengers.length) {
    throw new AppError("No passengers found in pool", 404);
  }

  const capacity = passengers[0].capacity;

  const occupiedSeats = passengers.reduce(
    (total, item) => total + item.seats_allocated,
    0,
  );

  return {
    poolId,
    vehicle: {
      model: passengers[0].model,
      capacity,
    },
    occupiedSeats,
    availableSeats: capacity - occupiedSeats,
    passengers: passengers.map((item) => ({
      rideId: item.ride_id,
      name: item.passenger_name,
      pickup: item.pickup_location,
      destination: item.destination_location,
      seats: item.seats_allocated,
      status: item.ride_status,
      fare: item.fare,
    })),
  };
};

module.exports = {
  addPassengerToPool,
  getPoolPassengers,
};
