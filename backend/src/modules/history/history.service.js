const historyRepository = require("./history.repository");

const AppError = require("../../utils/AppError");

// Passenger history

const getPassengerHistory = async (passengerId) => {
  const rides = await historyRepository.findPassengerHistory(passengerId);

  if (!rides.length) {
    throw new AppError("No ride history found", 404);
  }

  return rides;
};

// Driver history

const getDriverHistory = async (driverId) => {
  const trips = await historyRepository.findDriverHistory(driverId);

  if (!trips.length) {
    throw new AppError("No trip history found", 404);
  }

  return trips;
};

module.exports = {
  getPassengerHistory,
  getDriverHistory,
};
