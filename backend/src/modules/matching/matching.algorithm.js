const MAX_DETOUR_DISTANCE = 5; // km

// Calculate available seats

const calculateAvailableSeats = (capacity, occupiedSeats) => {
  return capacity - occupiedSeats;
};

// Check seat availability

const isSeatAvailable = (capacity, occupiedSeats, requestedSeats) => {
  const availableSeats = calculateAvailableSeats(capacity, occupiedSeats);

  return availableSeats >= requestedSeats;
};

// Calculate extra distance after adding passenger

const calculateDetour = (oldDistance, newDistance) => {
  return Math.max(0, newDistance - oldDistance);
};

// Check whether passenger can join pool

const isDetourAcceptable = (oldDistance, newDistance) => {
  const detour = calculateDetour(oldDistance, newDistance);

  return detour <= MAX_DETOUR_DISTANCE;
};

// Calculate matching score

const calculateMatchScore = ({ extraDistance, availableSeats }) => {
  let score = 100;

  score -= extraDistance * 5;

  score += availableSeats * 2;

  return score;
};

module.exports = {
  calculateAvailableSeats,
  isSeatAvailable,
  calculateDetour,
  isDetourAcceptable,
  calculateMatchScore,
};
