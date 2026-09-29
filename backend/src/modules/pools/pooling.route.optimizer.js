const graphService = require("../graph/graph.service");

const MAX_DETOUR_DISTANCE = 2;

// Calculate detour

const calculateDetour = (oldDistance, newDistance) => {
  return newDistance - oldDistance;
};

// Check detour limit

const isDetourAcceptable = (oldDistance, newDistance) => {
  const detour = calculateDetour(oldDistance, newDistance);

  return detour <= MAX_DETOUR_DISTANCE;
};

// Drop stops the Tesla already makes, so a matching pickup and destination
// cannot produce a route like [1, 1, 2, 3, 3].
const collapseConsecutiveDuplicates = (route) => {
  const collapsed = [];

  for (const stop of route) {
    if (collapsed[collapsed.length - 1] !== stop) {
      collapsed.push(stop);
    }
  }

  return collapsed;
};

// Generate possible routes

const generateInsertionRoutes = (currentRoute, pickup, destination) => {
  const routes = [];

  for (let i = 0; i <= currentRoute.length; i++) {
    for (let j = i + 1; j <= currentRoute.length + 1; j++) {
      const route = [
        ...currentRoute.slice(0, i),
        pickup,
        ...currentRoute.slice(i, j),
        destination,
        ...currentRoute.slice(j),
      ];

      routes.push(collapseConsecutiveDuplicates(route));
    }
  }

  return routes;
};

// Calculate complete route distance

const calculateRouteDistance = async (route, graph) => {
  graph = graph ?? await graphService.loadGraph();
  let distance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const result = await graphService.shortestPath(route[i], route[i + 1], graph);

    if (!result) {
      return Infinity;
    }

    distance += result.distance;
  }

  return distance;
};

// Find optimized route

const findBestRoute = async ({ currentRoute, pickup, destination, graph }) => {
  graph = graph ?? await graphService.loadGraph();
  const possibleRoutes = generateInsertionRoutes(
    currentRoute,
    pickup,
    destination,
  );

  let bestRoute = null;

  let minimumDistance = Infinity;

  for (const route of possibleRoutes) {
    const distance = await calculateRouteDistance(route, graph);

    if (distance < minimumDistance) {
      minimumDistance = distance;

      bestRoute = route;
    }
  }

  if (!bestRoute) {
    return null;
  }

  return {
    route: bestRoute,
    distance: minimumDistance,
  };
};

// Rebuild a pool's stop order from the rides that are still in it.
//
// A cancellation changes who is in the car, so the stop order that was optimal
// a moment ago need not be optimal now: the cancelled rider's stops are stops
// the driver should no longer drive to, and removing them can leave the rest in
// an order that costs more than it needs to. So the path is built again from
// scratch rather than filtered.
//
// Two things this gets right that filtering the old path does not:
//
// The route is anchored on where the Tesla actually is, not on wherever the
// pool happened to open. The driver may have moved since.
//
// Every rider's pickup is still placed before that same rider's destination,
// because findBestRoute always inserts the pair it is handed in order. A filter
// has no such guarantee: it can leave a rider's drop ahead of their pickup if
// the same place appears twice in the path.
const buildOptimalPath = async ({ riders, startLocationId, graph }) => {
  if (!Array.isArray(riders) || riders.length === 0) {
    return null;
  }

  graph = graph ?? (await graphService.loadGraph());

  // Insertion is greedy, so the order the pairs are offered in affects which
  // local optimum is reached. Sorting by ride id makes the result the same on
  // every call, rather than depending on the row order Postgres happened to
  // return.
  const ordered = [...riders].sort((a, b) => a.rideId - b.rideId);

  let path = [];

  for (const rider of ordered) {
    const inserted = await findBestRoute({
      currentRoute: path,
      pickup: rider.pickupLocationId,
      destination: rider.destinationLocationId,
      graph,
    });

    if (!inserted) {
      return null;
    }

    path = inserted.route;
  }

  if (startLocationId === null || startLocationId === undefined) {
    return { path, distance: await calculateRouteDistance(path, graph) };
  }

  const approach = await graphService.shortestPath(
    startLocationId,
    path[0],
    graph,
  );

  if (!approach) {
    return null;
  }

  // approach.path already ends at path[0], so the shared stop is not repeated.
  const fullPath = [...approach.path, ...path.slice(1)];

  return { path: fullPath, distance: await calculateRouteDistance(fullPath, graph) };
};

module.exports = {
  calculateDetour,
  isDetourAcceptable,
  generateInsertionRoutes,
  calculateRouteDistance,
  findBestRoute,
  buildOptimalPath,
};
