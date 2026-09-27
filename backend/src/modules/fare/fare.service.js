const { calculateFare } = require("./fare.utils");

// `isPool` unlocks the discount. Returns the breakdown alongside the total
// so callers can store the total and show the passenger the parts.
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
