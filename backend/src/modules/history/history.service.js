const historyRepository = require("./history.repository");

// Return an empty list for accounts without history.
const getPassengerHistory = async (passengerId) => {
  return historyRepository.findPassengerHistory(passengerId);
};

const getDriverHistory = async (driverId) => {
  return historyRepository.findDriverHistory(driverId);
};

module.exports = {
  getPassengerHistory,
  getDriverHistory,
};
