const calculateAvailableSeats = (capacity, occupiedSeats) => {
  return capacity - occupiedSeats;
};

const isSeatAvailable = (capacity, occupiedSeats, requestedSeats) => {
  const availableSeats = calculateAvailableSeats(capacity, occupiedSeats);

  return availableSeats >= requestedSeats;
};

const isRouteCompatible = (
  driverRoute,
  pickupLocation,
  destinationLocation,
) => {
  const pickupIndex = driverRoute.indexOf(pickupLocation);

  const destinationIndex = driverRoute.indexOf(destinationLocation);

  if (pickupIndex === -1 || destinationIndex === -1) {
    return false;
  }

  return pickupIndex < destinationIndex;
};

const calculateMatchScore = ({ extraDistance, availableSeats }) => {
  let score = 100;

  // Penalize extra detour

  score -= extraDistance * 5;

  // Prefer more available seats

  score += availableSeats * 2;

  return score;
};

module.exports = {
  calculateAvailableSeats,

  isSeatAvailable,

  isRouteCompatible,

  calculateMatchScore,
};
