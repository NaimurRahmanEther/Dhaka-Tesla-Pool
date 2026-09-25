const matchingRepository = require("./matching.repository");

const {
  isSeatAvailable,
  isDetourAcceptable,
  calculateMatchScore,
} = require("./matching.algorithm");

const graphService = require("../graph/graph.service");

const fareService = require("../fare/fare.service");

const AppError = require("../../utils/AppError");

const matchRide = async (ride) => {
  const vehicles = await matchingRepository.findAvailableVehicles();

  if (!vehicles.length) {
    throw new AppError("No available vehicle found", 404);
  }

  let bestMatch = null;

  for (const vehicle of vehicles) {
    const activePool = await matchingRepository.findActivePoolByVehicleId(
      vehicle.vehicle_id,
    );

    let occupiedSeats = 0;

    let currentRoute = null;

    if (activePool) {
      const poolRides = await matchingRepository.getPoolRides(activePool.id);

      occupiedSeats = poolRides.reduce(
        (total, item) => total + item.seats_allocated,
        0,
      );

      currentRoute = activePool.current_route;
    }

    const seatAvailable = isSeatAvailable(
      vehicle.capacity,
      occupiedSeats,
      ride.seats_requested,
    );

    if (!seatAvailable) {
      continue;
    }

    let calculatedRoute;

    if (!activePool) {
      calculatedRoute = await graphService.calculateDriverRoute({
        currentLocationId: vehicle.current_location_id,
        pickupLocationId: ride.pickup_location_id,
        destinationLocationId: ride.destination_location_id,
      });
    } else {
      calculatedRoute = currentRoute;
    }

    if (!calculatedRoute) {
      continue;
    }

    if (currentRoute) {
      const allowed = isDetourAcceptable(
        currentRoute.distance,
        calculatedRoute.distance,
      );

      if (!allowed) {
        continue;
      }
    }

    const score = calculateMatchScore({
      extraDistance: currentRoute
        ? calculatedRoute.distance - currentRoute.distance
        : 0,
      availableSeats: vehicle.capacity - occupiedSeats,
    });

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        vehicle,
        activePool,
        occupiedSeats,
        route: calculatedRoute,
        score,
      };
    }
  }

  if (!bestMatch) {
    throw new AppError("No compatible driver found", 404);
  }

  const fareResult = await fareService.calculateRideFare({
    distance: bestMatch.route.distance,
    isPool: false,
  });

  await matchingRepository.updateRideFare(ride.id, fareResult.fare);

  const assignment = await matchingRepository.assignRideToPool({
    vehicleId: bestMatch.vehicle.vehicle_id,
    driverId: bestMatch.vehicle.driver_id,
    rideId: ride.id,
    seatsAllocated: ride.seats_requested,
    route: bestMatch.route,
  });

  return {
    assignment,
    driver: bestMatch.vehicle.driver_name,
    vehicleId: bestMatch.vehicle.vehicle_id,
    route: bestMatch.route,
    fare: fareResult.fare,
  };
};

module.exports = {
  matchRide,
};
