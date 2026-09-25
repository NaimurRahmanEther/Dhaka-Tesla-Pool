const tripRepository = require("./trip.repository");

const AppError = require("../../utils/AppError");

const getActiveTrip = async (driverId) => {
  const trips = await tripRepository.findActivePoolByDriverId(driverId);

  if (!trips.length) {
    throw new AppError(
      "No active trip found",

      404,
    );
  }

  return trips;
};

module.exports = {
  getActiveTrip,
};
