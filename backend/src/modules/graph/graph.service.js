const graphRepository = require("./graph.repository");

const { buildGraph } = require("./graph.utils");

const { findShortestPath } = require("./dijkstra");

// Reuse one graph within a calculation; new requests see fresh road data.
const loadGraph = async () => buildGraph(await graphRepository.getRoadEdges());

const shortestPath = async (start, destination, graph) => {
  return findShortestPath(graph ?? await loadGraph(), start, destination);
};

// Driver current location -> Pickup -> Destination

const calculateDriverRoute = async ({
  currentLocationId,
  pickupLocationId,
  destinationLocationId,
  graph,
}) => {
  graph = graph ?? await loadGraph();
  const routeToPickup = await shortestPath(currentLocationId, pickupLocationId, graph);

  if (!routeToPickup) {
    return null;
  }

  const routeToDestination = await shortestPath(
    pickupLocationId,
    destinationLocationId,
    graph,
  );

  if (!routeToDestination) {
    return null;
  }

  return {
    path: [...routeToPickup.path, ...routeToDestination.path.slice(1)],
    distance: routeToPickup.distance + routeToDestination.distance,
  };
};

const calculateRouteDistance = async (route, graph) => {
  graph = graph ?? await loadGraph();
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const result = await shortestPath(route[i], route[i + 1], graph);

    if (!result) {
      return Infinity;
    }

    totalDistance += result.distance;
  }

  return totalDistance;
};

module.exports = {
  loadGraph,
  shortestPath,
  calculateDriverRoute,
  calculateRouteDistance,
};
