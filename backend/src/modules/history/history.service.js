const historyRepository = require("./history.repository");

// An empty history is a normal state for a new account, so it returns an empty
// list rather than a 404. The frontend can then render "no rides yet".
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
