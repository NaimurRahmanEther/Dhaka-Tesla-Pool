const matchingRepository = require("./matching.repository");

const {
  isSeatAvailable,
  isRouteCompatible,
  calculateMatchScore,
} = require("./matching.algorithm");

const routeRepository = require("../routes/routes.repository");

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

    if (activePool) {
      const poolRides = await matchingRepository.getPoolRides(activePool.id);

      occupiedSeats = poolRides.reduce(
        (total, item) => total + item.seats_allocated,

        0,
      );
    }

    const seatAvailable = isSeatAvailable(
      vehicle.capacity,

      occupiedSeats,

      ride.seats_requested,
    );

    if (!seatAvailable) {
      continue;
    }

    /*
            Get driver's planned route

        */

    const driverRoute = await routeRepository.findRouteByDriverId(
      vehicle.driver_id,
    );

    if (!driverRoute) {
      continue;
    }

    const compatible = isRouteCompatible(
      driverRoute.route.path,

      ride.pickup_location_id,

      ride.destination_location_id,
    );

    if (!compatible) {
      continue;
    }

    const score = calculateMatchScore({
      extraDistance: 0,

      availableSeats: vehicle.capacity - occupiedSeats,
    });

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        vehicle,

        activePool,

        occupiedSeats,

        score,
      };
    }
  }

  if (!bestMatch) {
    throw new AppError(
      "No compatible driver found",

      404,
    );
  }

  /*
        Now assign ride

        Transaction happens inside repository

    */

  const assignment = await matchingRepository.assignRideToPool({
    vehicleId: bestMatch.vehicle.vehicle_id,

    driverId: bestMatch.vehicle.driver_id,

    rideId: ride.id,

    seatsAllocated: ride.seats_requested,
  });

  return {
    assignment,

    driver: bestMatch.vehicle.driver_name,

    vehicleId: bestMatch.vehicle.vehicle_id,
  };
};

module.exports = {
  matchRide,
};
