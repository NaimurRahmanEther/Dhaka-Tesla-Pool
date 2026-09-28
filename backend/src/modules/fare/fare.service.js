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
  refreshPoolFares: async (client, poolId) => {
    const { rows } = await client.query(
      `SELECT rides.* FROM rides JOIN pool_rides ON pool_rides.ride_id=rides.id
       WHERE pool_rides.pool_id=$1 AND rides.status IN ('MATCHED','DRIVER_ARRIVED','ONGOING')
       ORDER BY rides.id FOR UPDATE OF rides`, [poolId],
    );
    const shared = new Set(rows.map((ride) => ride.passenger_id)).size >= 2;
    const edges = await client.query("SELECT * FROM road_edges");
    const graph = require("../graph/graph.utils").buildGraph(edges.rows);
    const { findShortestPath } = require("../graph/dijkstra");
    const updated = new Map();
    for (const ride of rows) {
      const leg = findShortestPath(graph, ride.pickup_location_id, ride.destination_location_id);
      if (!leg) throw new Error("Passenger route is unavailable");
      const breakdown = await calculateRideFare({
        distance: leg.distance, isPool: shared || ride.fare_breakdown?.isPool === true,
      });
      const result = await client.query(
        "UPDATE rides SET fare=$1, fare_breakdown=$2 WHERE id=$3 RETURNING *",
        [breakdown.fare, JSON.stringify(breakdown), ride.id],
      );
      updated.set(ride.id, result.rows[0]);
    }
    return updated;
  },
  calculateRideFare,
};
