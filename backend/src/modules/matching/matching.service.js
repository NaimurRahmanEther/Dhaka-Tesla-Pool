const pool = require("../../database/db");

// The route optimiser lives with the pooling module; it is the single place
// that knows how to insert a new stop into an existing Tesla route.
const {
  findBestRoute,
  isDetourAcceptable,
} = require("../pools/pooling.route.optimizer");

const graphService = require("../graph/graph.service");
const fareService = require("../fare/fare.service");
const matchingRepository = require("./matching.repository");

const AppError = require("../../utils/AppError");

// Raised when a pool filled up between ranking and claiming, so the matcher
// moves to the next candidate instead of failing.
const NO_SEAT = "NO_SEAT_AVAILABLE";

// How a Tesla would serve this ride now, or null. Both planners name the stop
// list differently, so the route is normalised to { path, distance } here.
const planRoute = async ({ vehicle, activePool, ride }) => {
  const currentRoute = activePool ? activePool.current_route : null;

  if (currentRoute && currentRoute.path) {
    const planned = await findBestRoute({
      currentRoute: currentRoute.path,
      pickup: ride.pickup_location_id,
      destination: ride.destination_location_id,
    });

    if (!planned) return null;

    if (!isDetourAcceptable(currentRoute.distance, planned.distance)) {
      return null;
    }

    return {
      route: { path: planned.route, distance: planned.distance },
      extraDistance: planned.distance - currentRoute.distance,
    };
  }

  // No pool yet: drive to the pickup, then on to the destination.
  const planned = await graphService.calculateDriverRoute({
    currentLocationId: vehicle.current_location_id,
    pickupLocationId: ride.pickup_location_id,
    destinationLocationId: ride.destination_location_id,
  });

  if (!planned) return null;

  return { route: planned, extraDistance: 0 };
};

// Seats already taken in a Tesla's active pool.
const occupiedIn = async (activePool) => {
  if (!activePool) return 0;

  const poolRides = await matchingRepository.getPoolRides(activePool.id);

  return poolRides.reduce((total, item) => total + item.seats_allocated, 0);
};

// The passenger is billed for their own leg (pickup -> destination), never for
// the driver's deadhead drive to the pickup point.
const passengerLegDistance = async (ride) =>
  graphService.calculateRouteDistance([
    ride.pickup_location_id,
    ride.destination_location_id,
  ]);

// Claim a seat in one Tesla. Single write path for both automatic matching and
// manual accept. Capacity is decided in the transaction, so checks here are advisory.
const claimSeat = async ({ ride, vehicle, activePool, route }) => {
  // The first passenger into a pool pays the solo fare; sharing a Tesla is
  // what earns the discount.
  const isPool = Boolean(activePool);

  const fareResult = await fareService.calculateRideFare({
    distance: await passengerLegDistance(ride),
    isPool,
  });

  const assignment = await matchingRepository.assignRideToPool({
    vehicleId: vehicle.vehicle_id,
    driverId: vehicle.driver_id,
    rideId: ride.id,
    seatsAllocated: ride.seats_requested,
    route,
  });

  await matchingRepository.updateRideFare(ride.id, fareResult.fare, fareResult);

  return {
    assignment,
    driver: vehicle.driver_name,
    vehicleId: vehicle.vehicle_id,
    pooled: isPool,
    route,
    fare: fareResult.fare,
    fareBreakdown: fareResult,
  };
};

// Automatic matching: rank every online Tesla and try them best first.
const matchRide = async (ride) => {
  const vehicles = await matchingRepository.findAvailableVehicles();

  if (!vehicles.length) {
    throw new AppError("No available vehicle found", 404);
  }

  const candidates = [];

  for (const vehicle of vehicles) {
    const activePool = await matchingRepository.findActivePoolByVehicleId(
      vehicle.vehicle_id,
    );

    const occupiedSeats = await occupiedIn(activePool);
    const freeSeats = vehicle.capacity - occupiedSeats;

    // Cheap pre-filter only. Racy by nature, and deliberately not trusted.
    if (freeSeats < ride.seats_requested) {
      continue;
    }

    const plan = await planRoute({ vehicle, activePool, ride });

    if (!plan) {
      continue;
    }

    candidates.push({
      vehicle,
      activePool,
      freeSeats,
      route: plan.route,
      score: calculateScore(plan.extraDistance, freeSeats),
    });
  }

  if (!candidates.length) {
    throw new AppError("No compatible driver found", 404);
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const candidate of candidates) {
    try {
      return await claimSeat({ ride, ...candidate });
    } catch (error) {
      // Someone else took the last seat first. Move on to the next Tesla
      // rather than failing the whole request.
      if (error.code === NO_SEAT) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError("No seat could be claimed for this ride", 409);
};

// The requests a driver can choose from. The frontend polls this; no
// websockets or push channel are involved.
const listOpenRequests = async (driverId) => {
  const vehicle = await matchingRepository.findVehicleByDriverId(driverId);

  if (!vehicle) {
    throw new AppError("Register a Tesla before browsing requests", 403);
  }

  if (vehicle.status !== "ONLINE") {
    throw new AppError("Go online before browsing requests", 403);
  }

  const activePool = await matchingRepository.findActivePoolByVehicleId(
    vehicle.vehicle_id,
  );

  const occupiedSeats = await occupiedIn(activePool);
  const freeSeats = vehicle.capacity - occupiedSeats;

  // Every ride still waiting for a driver, with the distance from this Tesla
  // and whether it could realistically be picked up.
  const requests = await matchingRepository.findOpenRequests();

  const enriched = [];

  for (const request of requests) {
    const plan = await planRoute({ vehicle, activePool, ride: request });

    enriched.push({
      ...request,
      freeSeats,
      detourKm: plan ? Math.max(0, plan.extraDistance) : null,
      detourAcceptable: plan !== null,
      fitsInMyTesla: freeSeats >= request.seats_requested,
    });
  }

  // Rides this driver could actually take come first.
  enriched.sort((a, b) => {
    const aTakeable = a.detourAcceptable && a.fitsInMyTesla ? 1 : 0;
    const bTakeable = b.detourAcceptable && b.fitsInMyTesla ? 1 : 0;

    if (aTakeable !== bTakeable) return bTakeable - aTakeable;

    if (a.detourKm !== b.detourKm) {
      return (a.detourKm ?? Infinity) - (b.detourKm ?? Infinity);
    }

    return new Date(a.requested_at) - new Date(b.requested_at);
  });

  return enriched;
};

// A driver accepts one specific request with their own Tesla.
const acceptRide = async (ride, driverId) => {
  const vehicle = await matchingRepository.findVehicleByDriverId(driverId);

  if (!vehicle) {
    throw new AppError("Register a Tesla before accepting rides", 403);
  }

  if (vehicle.status !== "ONLINE") {
    throw new AppError("Go online before accepting rides", 403);
  }

  const activePool = await matchingRepository.findActivePoolByVehicleId(
    vehicle.vehicle_id,
  );

  const freeSeats = vehicle.capacity - (await occupiedIn(activePool));

  if (freeSeats < ride.seats_requested) {
    throw new AppError(
      `Not enough seats available: ${freeSeats} left, ${ride.seats_requested} requested`,
      409,
      NO_SEAT,
    );
  }

  const plan = await planRoute({ vehicle, activePool, ride });

  if (!plan) {
    throw new AppError(
      "Picking this up up would detour too far from the current route",
      409,
    );
  }

  try {
    return await claimSeat({ ride, vehicle, activePool, route: plan.route });
  } catch (error) {
    // Re-raise the seat error with a message aimed at a driver, not a passenger.
    if (error.code === NO_SEAT) {
      throw new AppError(
        "The last seat was just taken, this request is no longer available",
        409,
        NO_SEAT,
      );
    }

    throw error;
  }
};

// Prefer a short detour, then whatever spare seats the Tesla has left.
const calculateScore = (extraDistance, availableSeats) => {
  return 100 - extraDistance * 5 + availableSeats * 2;
};

module.exports = {
  matchRide,
  listOpenRequests,
  acceptRide,
  calculateScore,
};
