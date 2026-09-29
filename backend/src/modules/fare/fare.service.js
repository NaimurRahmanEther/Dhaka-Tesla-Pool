const { pricePool, BASE_FARE, PRICE_PER_KM } = require("./fare.utils");

const graphService = require("../graph/graph.service");

// Measure each hop of the pool's ordered stop list. The stored path is a list
// of location ids, and consecutive stops are joined by their shortest path, so
// this mirrors exactly how the route's own distance was built.
const measureSegments = async (path, graph) => {
  const segments = [];

  for (let i = 0; i < path.length - 1; i += 1) {
    const hop = await graphService.shortestPath(path[i], path[i + 1], graph);

    if (!hop) {
      throw new Error("Pool route is unavailable");
    }

    segments.push({ from: path[i], to: path[i + 1], distance: hop.distance });
  }

  return segments;
};

// Price a pool's trip once and split it between everyone on board.
//
// Every rider in a pool is repriced on each call, deliberately: a rider's share
// depends on who else is in the car, so the moment Shirin takes the last seat
// the earlier fares have to move with her. A fare locked at match time would
// drift away from the split the passengers were shown.
const refreshPoolFares = async (client, poolId) => {
  const poolResult = await client.query(
    `SELECT * FROM pools WHERE id=$1 FOR UPDATE`,
    [poolId],
  );

  const poolRow = poolResult.rows[0];

  if (!poolRow) {
    throw new Error("Pool not found");
  }

  const { rows } = await client.query(
    `SELECT rides.* FROM rides JOIN pool_rides ON pool_rides.ride_id=rides.id
     WHERE pool_rides.pool_id=$1 AND rides.status IN ('MATCHED','DRIVER_ARRIVED','ONGOING')
     ORDER BY rides.id`,
    [poolId],
  );

  // Checked before the route, not after. Cancelling the last passenger empties
  // the pool and clears its route, and there is nothing left to price - so this
  // has to be a quiet empty result rather than the "no route" error below,
  // which would roll back the very cancellation that emptied the pool.
  if (!rows.length) {
    return new Map();
  }

  const route = poolRow.current_route;

  if (!route || !Array.isArray(route.path) || route.path.length < 2) {
    throw new Error("Pool route not found");
  }

  const graph = await graphService.loadGraph();
  const segments = await measureSegments(route.path, graph);

  // The route the driver actually drives, not the sum of everyone's legs: two
  // riders over the same road is still one drive.
  const routeDistance = segments.reduce(
    (total, segment) => total + segment.distance,
    0,
  );

  const isPool = new Set(rows.map((ride) => ride.passenger_id)).size >= 2;

  const riders = rows.map((ride) => {
    // The drop is looked for strictly after the pickup. A route can visit the
    // same place twice - two riders sharing a corridor, or a drop that is also
    // somebody else's pickup - and a bare indexOf for the drop would find the
    // earlier visit and report the rider as travelling backwards, or as never
    // being on the route at all.
    const pickupIndex = route.path.indexOf(Number(ride.pickup_location_id));
    const dropIndex = route.path.indexOf(
      Number(ride.destination_location_id),
      pickupIndex + 1,
    );

    // Every rider in a pool was inserted into this route by the optimiser, so
    // its stops must be on the path. If they are not, the ride would silently
    // occupy no road and be priced at zero while still holding a seat.
    if (pickupIndex < 0 || dropIndex <= pickupIndex) {
      throw new Error(
        `Ride ${ride.id} is in the pool but its stops are missing from the route`,
      );
    }

    return { rideId: ride.id, seats: ride.seats_requested, pickupIndex, dropIndex };
  });

  const {
    riders: priced,
    roadCost,
    baseTotal,
    discountTotal,
    total,
  } = pricePool({
    segments,
    riders,
  });

  const updated = new Map();

  for (const rider of priced) {
    const breakdown = {
      isPool,
      poolDistance: routeDistance,
      pricePerKm: PRICE_PER_KM,
      baseFare: BASE_FARE,
      // The road the driver drives, paid for once by whoever is aboard for it.
      roadCost,
      // A base for every booking, which is why the pool collects more than the
      // journey costs to run.
      baseTotal,
      discountTotal,
      poolTotal: total,
      occupiedDistance: rider.occupiedDistance,
      sharedDistance: rider.sharedDistance,
      soloDistance: rider.soloDistance,
      sharedWith: rider.sharedWith,
      // Whether this particular rider earned the discount, by sharing at least
      // one segment. False for a rider who sat out the whole trip alone.
      sharedRoad: rider.sharedRoad,
      seats: rider.seats,
      // The charge broken into the two things it is made of, so the fare can be
      // checked against the arithmetic that produced it.
      distanceCharge: rider.distanceCharge,
      poolDiscount: rider.poolDiscount,
      baseShare: rider.baseShare,
      fare: rider.fare,
      // Every stretch this rider rode, with who else was in the car for it and
      // what they paid for it. This is the part a passenger disputes, if any.
      legs: rider.legs,
    };

    const result = await client.query(
      "UPDATE rides SET fare=$1, fare_breakdown=$2 WHERE id=$3 RETURNING *",
      [rider.fare, JSON.stringify(breakdown), rider.riderId],
    );

    updated.set(rider.riderId, result.rows[0]);
  }

  return updated;
};

module.exports = { refreshPoolFares };
