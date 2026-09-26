const rideRepository = require("./ride.repository");

const locationRepository = require("../../modules/location/location.repository");
const historyRepository = require("../history/history.repository");

const AppError = require("../../utils/AppError");

const { RIDE_STATUS, isCancellable } = require("./rideStatus");

// Create ride request

const createRide = async (passengerId, data) => {
  if (data.pickupLocationId === data.destinationLocationId) {
    throw new AppError("Pickup and destination cannot be same", 400);
  }

  const pickup = await locationRepository.findLocationById(
    data.pickupLocationId,
  );

  const destination = await locationRepository.findLocationById(
    data.destinationLocationId,
  );

  if (!pickup || !destination) {
    throw new AppError("Invalid location", 400);
  }

  return rideRepository.createRide({
    passengerId,
    pickupLocationId: data.pickupLocationId,
    destinationLocationId: data.destinationLocationId,
    seatsRequested: data.seatsRequested,
  });
};

// Get passenger rides

const getMyRides = async (passengerId) => {
  return rideRepository.findRidesByPassengerId(passengerId);
};

// Cancel ride

const cancelRide = async (passengerId, rideId) => {
  const ride = await rideRepository.findRideById(rideId);

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (ride.passenger_id !== passengerId) {
    throw new AppError("You cannot cancel this ride", 403);
  }

  // A passenger may cancel while the ride has not departed yet. Once the driver
  // is on the way the seats are committed and the status must not move.
  if (!isCancellable(ride.status)) {
    throw new AppError(
      `Ride cannot be cancelled once it is ${ride.status}`,
      400,
    );
  }

  return rideRepository.cancelRide({
    rideId,
    actorId: passengerId,
  });
};

// Ride timeline, readable by the requesting passenger and the serving driver
// only: the trail names both of them, so it is not public.

const getRideTimeline = async (rideId, userId, role) => {
  const ride = await rideRepository.findRideById(rideId);

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (role === "PASSENGER" && ride.passenger_id !== userId) {
    throw new AppError("You cannot view this ride", 403);
  }

  if (role === "DRIVER") {
    const servesRide = await rideRepository.isRideInDriverPool(rideId, userId);

    if (!servesRide) {
      throw new AppError("You cannot view this ride", 403);
    }
  }

  const timeline = await historyRepository.findRideTimeline(rideId);

  return {
    ride: {
      id: ride.id,
      status: ride.status,
      fare: ride.fare,
      fareBreakdown: ride.fare_breakdown,
      requestedAt: ride.requested_at,
      matchedAt: ride.matched_at,
      arrivedAt: ride.arrived_at,
      startedAt: ride.started_at,
      cancelledAt: ride.cancelled_at,
    },
    timeline,
  };
};

module.exports = {
  createRide,
  getMyRides,
  cancelRide,
  getRideTimeline,
};
