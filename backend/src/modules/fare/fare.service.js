const { calculateFare } = require("./fare.utils");

const calculateRideFare = async ({ distance, isPool }) => {
  const fare = calculateFare({
    distance,
    isPool,
  });

  return {
    distance,
    fare,
  };
};

module.exports = {
  calculateRideFare,
};
