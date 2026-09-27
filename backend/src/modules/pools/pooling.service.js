const pool = require("../../database/db");

const poolingRepository = require("./pooling.repository");

// The route optimiser measures the insertion route and applies the detour limit.
const { findBestRoute, isDetourAcceptable } = require("./pooling.route.optimizer");

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

    // Live capacity from the Tesla, not the pool's opening snapshot.
    const availableSeats = activePool.vehicle_capacity - occupiedSeats;

    if (availableSeats < ride.seats_requested) {
      throw new AppError(
        `Not enough seats available: ${availableSeats} left, ${ride.seats_requested} requested`,
        409,
        "NO_SEAT_AVAILABLE",
      );
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

    const updatedRide = await poolingRepository.confirmRideInPool(client, {
      rideId: ride.id,
      fare: fareResult.fare,
      fareBreakdown: fareResult,
    });

    const updatedPool = await poolingRepository.updatePoolRoute(client, {
      poolId,
      route: {
        path: bestRoute.route,
        distance: bestRoute.distance,
      },
    });

    await client.query("COMMIT");

    return {
      poolRide,
      pool: updatedPool,
      ride: updatedRide,
      fare: fareResult.fare,
      fareBreakdown: fareResult,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

// Get passengers inside pool

const getPoolPassengers = async (poolId, driverId) => {
  // A pool manifest lists every passenger's route and fare, so it is only
  // readable by the driver who owns that Tesla.
  const poolRow = await poolingRepository.findPoolById(poolId);

  if (!poolRow) {
    throw new AppError("Pool not found", 404);
  }

  if (poolRow.driver_id !== driverId) {
    throw new AppError("You cannot view this pool", 403);
  }

  const passengers = await poolingRepository.getPoolPassengers(poolId);

  const occupiedSeats = passengers.reduce(
    (total, item) => total + item.seats_allocated,
    0,
  );

  // Capacity and model come from the Tesla, so a freshly opened pool with no
  // passengers yet still answers instead of 404.
  const vehicle = await poolingRepository.getPoolVehicle(poolId);

  const capacity = vehicle ? vehicle.capacity : poolRow.capacity;

  return {
    poolId,
    vehicle: {
      model: vehicle ? vehicle.model : null,
      capacity,
    },
    occupiedSeats,
    availableSeats: capacity - occupiedSeats,
    passengers: passengers.map((item) => ({
      rideId: item.ride_id,
      name: item.passenger_name,
      pickup: item.pickup_location,
      destination: item.destination_location,
      seatsAllocated: item.seats_allocated,
      status: item.ride_status,
      fare: item.fare,
    })),
  };
};

module.exports = {
  addPassengerToPool,
  getPoolPassengers,
};
