const graphService = require("../graph/graph.service");

const { buildOptimalPath } = require("./pooling.route.optimizer");

// Re-plan a pool's route after one of its passengers is removed, and reprice
// whoever is left.
//
// Both ways out of a cancellation land here - the driver removing a passenger
// from the manifest, and the passenger cancelling their own ride - so the route
// and the fares cannot drift apart between them. The fares have to move with
// the route: a fare is that rider's share of the road actually driven, so a
// route that is re-planned without repricing would leave every remaining
// passenger being charged for a journey that is no longer the one being driven.
//
// A pool with nobody left in it is given a null route, because there is nothing
// left to serve. If the remaining riders cannot be linked into a drivable path
// at all - an unreachable location, say - the stored route is left as it is.
// A stale route is more use to a driver than no route, and replacing it with
// null would look to the UI like the trip had no destination.
const rebuildPoolRoute = async (client, poolId) => {
  const poolResult = await client.query(
    `SELECT pools.current_route, vehicles.current_location_id
     FROM pools
     JOIN vehicles ON vehicles.id = pools.vehicle_id
     WHERE pools.id=$1
     FOR UPDATE OF pools`,
    [poolId],
  );

  const found = poolResult.rows[0];

  if (!found) {
    return null;
  }

  // Anyone still in the car. A cancelled or completed ride is not aboard, and
  // its own membership row is already gone by the time this runs.
  const riders = await client.query(
    `SELECT rides.id, rides.pickup_location_id, rides.destination_location_id
     FROM rides
     JOIN pool_rides ON pool_rides.ride_id = rides.id
     WHERE pool_rides.pool_id=$1
     AND rides.status NOT IN ('CANCELLED','COMPLETED')
     ORDER BY rides.id`,
    [poolId],
  );

  if (!riders.rows.length) {
    await client.query(
      `UPDATE pools
       SET current_route=NULL, route_updated_at=CURRENT_TIMESTAMP
       WHERE id=$1`,
      [poolId],
    );

    return null;
  }

  const graph = await graphService.loadGraph();

  const rebuilt = await buildOptimalPath({
    riders: riders.rows.map((ride) => ({
      rideId: ride.id,
      pickupLocationId: ride.pickup_location_id,
      destinationLocationId: ride.destination_location_id,
    })),
    startLocationId: found.current_location_id,
    graph,
  });

  if (!rebuilt) {
    return found.current_route;
  }

  await client.query(
    `UPDATE pools
     SET current_route=$1, route_updated_at=CURRENT_TIMESTAMP
     WHERE id=$2`,
    [JSON.stringify(rebuilt), poolId],
  );

  return rebuilt;
};

module.exports = {
  rebuildPoolRoute,
};
