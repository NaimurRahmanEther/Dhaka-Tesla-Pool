const {
  findBestRoute,
  isDetourAcceptable,
} = require("../pools/pooling.route.optimizer");

const graphService = require("../graph/graph.service");
const fareService = require("../fare/fare.service");
const matchingRepository = require("./matching.repository");
const routeRepository = require("../routes/routes.repository");

const AppError = require("../../utils/AppError");

const NO_SEAT = "NO_SEAT_AVAILABLE";

const planRoute = async ({ vehicle, activePool, ride, changeRoute = false }) => {
  if (changeRoute && activePool) {
    throw new AppError("You can change your route only before accepting your first passenger", 409);
  }
  const savedPlan = activePool || changeRoute
    ? null
    : await routeRepository.findAvailableRoute(
        vehicle.driver_id,
        vehicle.current_location_id,
      );
  const currentRoute = activePool
    ? activePool.current_route
    : savedPlan
      ? {
          ...savedPlan.route,
          stops: [savedPlan.start_location_id, savedPlan.destination_location_id],
          driverDestinationId: savedPlan.destination_location_id,
        }
      : null;

  if (currentRoute && currentRoute.path) {
    const planned = await findBestRoute({
      currentRoute: currentRoute.stops ?? currentRoute.path,
      pickup: ride.pickup_location_id,
      destination: ride.destination_location_id,
      keepDestination: Boolean(currentRoute.driverDestinationId),
    });

    if (!planned) return null;

    if (!isDetourAcceptable(currentRoute.distance, planned.distance)) {
      return null;
    }

    return {
      route: {
        path: planned.path,
        stops: planned.route,
        distance: planned.distance,
        driverDestinationId: currentRoute.driverDestinationId,
      },
      extraDistance: planned.distance - currentRoute.distance,
    };
  }

  const planned = await graphService.calculateDriverRoute({
    currentLocationId: vehicle.current_location_id,
    pickupLocationId: ride.pickup_location_id,
    destinationLocationId: ride.destination_location_id,
  });

  if (!planned) return null;

  return {
    route: {
      ...planned,
      ...(changeRoute ? { driverDestinationId: ride.destination_location_id } : {}),
      stops: [
        vehicle.current_location_id,
        ride.pickup_location_id,
        ride.destination_location_id,
      ],
    },
    extraDistance: 0,
  };
};

const occupiedIn = async (activePool) => {
  if (!activePool) return 0;

  const poolRides = await matchingRepository.getPoolRides(activePool.id);

  return poolRides.reduce((total, item) => total + item.seats_allocated, 0);
};

// Charge the passenger leg only, excluding the drive to pickup.
const passengerLegDistance = async (ride) =>
  graphService.calculateRouteDistance([
    ride.pickup_location_id,
    ride.destination_location_id,
  ]);

// Both matching paths share this claim; capacity checks are authoritative in the transaction.
const claimSeat = async ({ ride, vehicle, activePool, route, changeRoute = false }) => {
  // The first passenger pays the solo fare; later joiners receive the pool discount.
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
    replaceDriverRoute: changeRoute,
    buildRoute: async (lockedVehicle, lockedPool) => {
      const latest = await planRoute({
        vehicle: lockedVehicle,
        activePool: lockedPool,
        ride,
        changeRoute,
      });
      if (!latest) throw new AppError("This passenger no longer fits your route", 409);
      return latest.route;
    },
  });

  await matchingRepository.updateRideFare(ride.id, fareResult.fare, fareResult);

  return {
    assignment,
    driver: vehicle.driver_name,
    vehicleId: vehicle.vehicle_id,
    pooled: isPool,
    route: assignment.pool.current_route,
    routeChanged: changeRoute,
    fare: fareResult.fare,
    fareBreakdown: fareResult,
  };
};

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

    // Prefilter only; capacity must be checked again under the lock.
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
      // Try the next vehicle if another request claimed the remaining seats.
      if (error.code === NO_SEAT) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError("No seat could be claimed for this ride", 409);
};

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

  const requests = await matchingRepository.findOpenRequests();

  const enriched = [];

  for (const request of requests) {
    const plan = await planRoute({ vehicle, activePool, ride: request });
    const replacement = !activePool && !plan && freeSeats >= request.seats_requested
      ? await planRoute({ vehicle, activePool, ride: request, changeRoute: true })
      : null;

    enriched.push({
      ...request,
      freeSeats,
      detourKm: plan ? Math.max(0, plan.extraDistance) : null,
      detourAcceptable: plan !== null,
      fitsInMyTesla: freeSeats >= request.seats_requested,
      canChangeRoute: replacement !== null,
      replacementRoute: replacement?.route ?? null,
    });
  }

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

const acceptRide = async (ride, driverId, { changeRoute = false } = {}) => {
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

  const plan = await planRoute({ vehicle, activePool, ride, changeRoute });

  if (!plan) {
    throw new AppError(
      changeRoute ? "No route is available for this passenger" : "This passenger would detour too far from your current route",
      409,
    );
  }

  try {
    return await claimSeat({ ride, vehicle, activePool, route: plan.route, changeRoute });
  } catch (error) {
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

const calculateScore = (extraDistance, availableSeats) => {
  return 100 - extraDistance * 5 + availableSeats * 2;
};

module.exports = {
  matchRide,
  listOpenRequests,
  acceptRide,
  calculateScore,
};
