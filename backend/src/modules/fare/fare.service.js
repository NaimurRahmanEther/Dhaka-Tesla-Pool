const { calculateFare } = require("./fare.utils");

const calculateRideFare = async ({ distance, isPool = false }) => {
  const breakdown = calculateFare({ distance, isPool });

  return {
    distance,
    isPool,
    ...breakdown,
  };
};

module.exports = {
  calculateRideFare,
};
