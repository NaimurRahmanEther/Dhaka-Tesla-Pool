const graphService = require("../graph/graph.service");

const MAX_DETOUR_DISTANCE = 5;

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

const calculateRouteDistance = async (route) => {
  let distance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const result = await graphService.shortestPath(route[i], route[i + 1]);

    if (!result) {
      return Infinity;
    }

    distance += result.distance;
  }

  return distance;
};

// Find optimized route

const findBestRoute = async ({ currentRoute, pickup, destination }) => {
  const possibleRoutes = generateInsertionRoutes(
    currentRoute,
    pickup,
    destination,
  );

  let bestRoute = null;

  let minimumDistance = Infinity;

  for (const route of possibleRoutes) {
    const distance = await calculateRouteDistance(route);

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

module.exports = {
  calculateDetour,
  isDetourAcceptable,
  generateInsertionRoutes,
  calculateRouteDistance,
  findBestRoute,
};
