const graphRepository = require("./graph.repository");

const { buildGraph } = require("./graph.utils");

const { findShortestPath } = require("./dijkstra");

const getRoadGraph = async () => {
  const edges = await graphRepository.getRoadEdges();

  const graph = buildGraph(edges);

  return graph;
};

const shortestPath = async (start, destination) => {
  const graph = await getRoadGraph();

  return findShortestPath(graph, start, destination);
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
  getRoadGraph,
  shortestPath,
  calculateDriverRoute,
  calculateRouteDistance,
};
