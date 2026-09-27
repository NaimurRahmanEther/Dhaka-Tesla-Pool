// Calculate and round fares in whole BDT.
const BASE_FARE = 50;
const PRICE_PER_KM = 20;

// Apply the pool discount to distance charges only.
const POOL_DISCOUNT_RATE = 0.25;

const calculateFare = ({ distance, isPool = false }) => {
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0) {
    throw new Error("Distance must be a finite, non-negative number");
  }

  const distanceCharge = Math.round(distance * PRICE_PER_KM);

  const poolDiscount = isPool
    ? Math.round(distanceCharge * POOL_DISCOUNT_RATE)
    : 0;

  const fare = BASE_FARE + distanceCharge - poolDiscount;

  return {
    baseFare: BASE_FARE,
    distanceCharge,
    poolDiscount,
    fare,
  };
};

module.exports = {
  BASE_FARE,
  PRICE_PER_KM,
  POOL_DISCOUNT_RATE,
  calculateFare,
};
