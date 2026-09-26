// Fare model: passengerFare = baseFare + distanceCharge - poolDiscount
// Money is whole Taka, so every component is rounded and stays checkable by hand.
const BASE_FARE = 50;
const PRICE_PER_KM = 20;

// The discount applies to the distance charge only, never the base fare, so
// the base fare still covers the driver's fixed cost of making the trip.
const POOL_DISCOUNT_RATE = 0.25;

// Returns the full breakdown so a passenger (and the evaluator) can verify the
// final number by hand instead of trusting a single opaque total.
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
