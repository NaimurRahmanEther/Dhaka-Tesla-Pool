const graphRepository = require("./graph.repository");

const { buildGraph } = require("./graph.utils");

const { findShortestPath } = require("./dijkstra");

// road_edges is small, so the graph is rebuilt from the database on every
// lookup. No cache, so an edge edit takes effect on the next request.
const shortestPath = async (start, destination) => {
  const edges = await graphRepository.getRoadEdges();

  return findShortestPath(buildGraph(edges), start, destination);
};

// Driver current location -> Pickup -> Destination

const calculateDriverRoute = async ({
  currentLocationId,
  pickupLocationId,
  destinationLocationId,
}) => {
  const routeToPickup = await shortestPath(currentLocationId, pickupLocationId);

  if (!routeToPickup) {
    return null;
  }

  const routeToDestination = await shortestPath(
    pickupLocationId,
    destinationLocationId,
  );

  if (!routeToDestination) {
    return null;
  }

  return {
    path: [...routeToPickup.path, ...routeToDestination.path.slice(1)],
    distance: routeToPickup.distance + routeToDestination.distance,
  };
};

const calculateRouteDistance = async (route) => {
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const result = await shortestPath(route[i], route[i + 1]);

    if (!result) {
      return Infinity;
    }

    totalDistance += result.distance;
  }

  return totalDistance;
};

// Expand ordered stops into the actual path through the seeded road graph.
const calculateRoutePath = async (stops) => {
  if (!stops.length) return null;
  const path = [stops[0]];
  let distance = 0;
  for (let i = 1; i < stops.length; i++) {
    const leg = await shortestPath(stops[i - 1], stops[i]);
    if (!leg) return null;
    path.push(...leg.path.slice(1));
    distance += leg.distance;
  }
  return { path, distance };
};

module.exports = {
  shortestPath,
  calculateDriverRoute,
  calculateRouteDistance,
  calculateRoutePath,
};
