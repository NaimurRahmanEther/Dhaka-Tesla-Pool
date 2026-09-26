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

module.exports = {
  shortestPath,
  calculateDriverRoute,
  calculateRouteDistance,
};
