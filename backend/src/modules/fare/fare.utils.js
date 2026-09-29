// Fare model: the trip is priced as a series of road segments, and each segment
// is paid for by whoever is actually in the car while it is being driven.
//
// The rule is deliberately narrow: you get a sharing discount on the road you
// share, and you pay full price on the road you do not. A rider alone on a
// stretch pays all of it, because there is nobody to share it with.
//
// The base fare is different in kind - it is the fixed cost of making the trip
// at all, not of any particular kilometre - so it is charged per booking rather
// than shared. Each rider on board pays their own base, whether or not they
// overlap anybody, which means a pool collects more than the trip costs. That
// is intentional: boarding the car is worth a flat fee of its own, and the
// driver is not short-changed when a car is full.
//
// Money carries to the poisha (1 Taka = 100 poisha), so a segment shared three
// ways is 26.67 rather than a rounded guess. All arithmetic runs in integer
// poisha: binary floating point cannot represent 26.67 exactly, so sums would
// drift and the riders would no longer add up to the trip's cost.
const BASE_FARE = 50;
const PRICE_PER_KM = 20;
const POISHA = 100;

// The sharing discount, unchanged from the flat-fare rule this replaced:
// fare = base + distance x rate - discount.
//
// It is earned per rider, and only by a rider who actually shared at least one
// segment. A rider travelling a private leg the whole way shares nothing, so
// there is nothing to discount and they pay the full rate.
//
// It comes off the road charge only, never the base fare, so the base still
// covers the driver's fixed cost of making the trip.
//
// A quarter is exactly representable in binary floating point, so scaling
// integer poisha by this rate is exact and the rounding below only ever
// resolves a half-poisha, never an error.
const POOL_DISCOUNT_RATE = 0.25;

const toPoisha = (taka) => Math.round(taka * POISHA);
const fromPoisha = (poisha) => poisha / POISHA;

// Distribute an integer amount across weights, so the shares always add back up
// to the amount exactly. Floors first, then the leftover units go to whoever
// was cut down hardest. Weights of zero simply receive nothing.
const allocateByWeight = (totalPoisha, weights) => {
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);

  if (totalWeight <= 0) {
    return weights.map(() => 0);
  }

  const exact = weights.map((weight) => (totalPoisha * weight) / totalWeight);
  const shares = exact.map(Math.floor);

  let remainder = totalPoisha - shares.reduce((total, share) => total + share, 0);

  const order = weights
    .map((weight, index) => ({ index, fraction: exact[index] - shares[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (const { index } of order) {
    if (remainder < 1) break;
    shares[index] += 1;
    remainder -= 1;
  }

  return shares;
};

// Whether a rider is in the car for a given segment of the route. A rider boards
// before the segment their pickup starts and leaves after the one their drop
// ends, so a rider who is dropped exactly where the next person boards shares
// no segment with them - they never travel a kilometre together.
const isAboard = ({ pickupIndex, dropIndex }, segmentIndex) =>
  Number.isInteger(pickupIndex) &&
  Number.isInteger(dropIndex) &&
  pickupIndex >= 0 &&
  dropIndex > pickupIndex &&
  segmentIndex >= pickupIndex &&
  segmentIndex < dropIndex;

// Price one pooled trip and return what each rider owes.
//
// `segments` is the pool's ordered road, `[{ from, to, distance }]`. Segments
// with nobody aboard are the driver's deadhead to the first pickup and are not
// billed to passengers at all.
//
// Returns the per-rider prices along with the trip's totals, so a caller can
// assert that the riders add up to what was actually charged rather than
// trusting that they do.
const pricePool = ({ segments, riders }) => {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("A pool needs at least one segment to price");
  }

  if (!Array.isArray(riders) || riders.length === 0) {
    throw new Error("A pool needs at least one rider to price");
  }

  const distancePoisha = riders.map(() => 0);
  const detail = riders.map(() => []);

  let roadCostPoisha = 0;

  segments.forEach((segment, index) => {
    const aboard = riders
      .map((rider, riderIndex) => (isAboard(rider, index) ? riderIndex : -1))
      .filter((riderIndex) => riderIndex >= 0);

    // The deadhead to the first pickup. Nobody is charged for it.
    if (!aboard.length) {
      return;
    }

    const costPoisha = toPoisha(Math.round(segment.distance * PRICE_PER_KM));
    roadCostPoisha += costPoisha;

    // Seats are the unit of claim on a seat: a booking that takes two seats is
    // two seats' worth of the road being used up.
    const weights = aboard.map((riderIndex) => Math.max(1, riders[riderIndex].seats));
    const shares = allocateByWeight(costPoisha, weights);

    aboard.forEach((riderIndex, position) => {
      distancePoisha[riderIndex] += shares[position];
      detail[riderIndex].push({
        from: segment.from,
        to: segment.to,
        distance: segment.distance,
        cost: fromPoisha(costPoisha),
        coRiders: aboard.length - 1,
        share: fromPoisha(shares[position]),
      });
    });
  });

  const totalDistancePoisha = distancePoisha.reduce((total, value) => total + value, 0);

  if (totalDistancePoisha === 0) {
    throw new Error("No rider occupies any road on this route");
  }

  // The base fare is a flat fee per booking, not a share of anything, so it is
  // not divided. Riders therefore do not sum to the road cost - they sum to the
  // road cost plus a base for each of them, less their own discounts, which is
  // deliberately more than the trip costs to run. A full car pays the driver
  // well.
  const priced = riders.map((rider, index) => {
    const legs = detail[index];
    const shared = legs.filter((leg) => leg.coRiders > 0);
    const alone = legs.filter((leg) => leg.coRiders === 0);

    const sum = (list, key) => list.reduce((total, leg) => total + leg[key], 0);

    const distancePoishaForRider = distancePoisha[index];

    const distanceCharge = fromPoisha(distancePoishaForRider);

    // Earned, not inherited: a rider only qualifies if they spent at least one
    // segment in the car with somebody else. Sharing the car as a concept is
    // not enough - the discount is for shared road.
    const sharedRoad = shared.length > 0;

    const poolDiscountPoisha = sharedRoad
      ? Math.round(distancePoishaForRider * POOL_DISCOUNT_RATE)
      : 0;

    const poolDiscount = fromPoisha(poolDiscountPoisha);

    return {
      riderId: rider.rideId,
      seats: Math.max(1, Number(rider.seats) || 1),
      // How much road this rider travels, and how much of it they share. The
      // split is only over the shared part; the solo part is charged whole.
      occupiedDistance: sum(legs, "distance"),
      sharedDistance: sum(shared, "distance"),
      soloDistance: sum(alone, "distance"),
      sharedWith: shared.reduce((total, leg) => total + leg.coRiders, 0),
      sharedRoad,
      distanceCharge,
      poolDiscount,
      baseShare: BASE_FARE,
      fare: distanceCharge - poolDiscount + BASE_FARE,
      legs,
    };
  });

  const roadCost = fromPoisha(roadCostPoisha);
  const baseTotal = BASE_FARE * riders.length;
  const discountTotal = priced.reduce((total, rider) => total + rider.poolDiscount, 0);

  return {
    riders: priced,
    roadCost,
    baseTotal,
    discountTotal,
    // What the pool collects. More than the road plus one base, because every
    // booking carries its own base.
    total: roadCost + baseTotal - discountTotal,
  };
};

module.exports = {
  BASE_FARE,
  PRICE_PER_KM,
  POOL_DISCOUNT_RATE,
  POISHA,
  toPoisha,
  fromPoisha,
  allocateByWeight,
  isAboard,
  pricePool,
};
