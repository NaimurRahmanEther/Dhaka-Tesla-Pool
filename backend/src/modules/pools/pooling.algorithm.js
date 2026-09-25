const MAX_DETOUR_DISTANCE = 5;

// Calculate extra distance after adding passenger

const calculateDetour = (oldDistance, newDistance) => {
  return newDistance - oldDistance;
};

// Check whether passenger can join pool

const isDetourAcceptable = (oldDistance, newDistance) => {
  const detour = calculateDetour(oldDistance, newDistance);

  return detour <= MAX_DETOUR_DISTANCE;
};

// Check if passenger route already exists inside pool route

const isRouteCompatible = (poolRoute, pickupLocation, destinationLocation) => {
  const pickupIndex = poolRoute.indexOf(pickupLocation);

  const destinationIndex = poolRoute.indexOf(destinationLocation);

  if (pickupIndex === -1 || destinationIndex === -1) {
    return false;
  }

  return pickupIndex < destinationIndex;
};

// Insert passenger pickup and destination
// into existing route

const insertPassengerRoute = (
  currentRoute,
  pickupLocation,
  destinationLocation,
) => {
  const newRoute = [...currentRoute];

  const pickupIndex = newRoute.indexOf(pickupLocation);

  const destinationIndex = newRoute.indexOf(destinationLocation);

  /*
        If pickup does not exist,
        insert before destination
    */

  if (pickupIndex === -1) {
    if (destinationIndex !== -1) {
      newRoute.splice(destinationIndex, 0, pickupLocation);
    } else {
      newRoute.push(pickupLocation);
    }
  }

  /*
        Add destination
    */

  if (!newRoute.includes(destinationLocation)) {
    newRoute.push(destinationLocation);
  }

  return newRoute;
};

// Generate possible passenger insertion routes

const generatePossibleRoutes = (
  currentRoute,
  pickupLocation,
  destinationLocation,
) => {
  const possibleRoutes = [];

  for (let i = 0; i <= currentRoute.length; i++) {
    const routeWithPickup = [
      ...currentRoute.slice(0, i),

      pickupLocation,

      ...currentRoute.slice(i),
    ];

    for (let j = i + 1; j <= routeWithPickup.length; j++) {
      const routeWithDestination = [
        ...routeWithPickup.slice(0, j),

        destinationLocation,

        ...routeWithPickup.slice(j),
      ];

      possibleRoutes.push(routeWithDestination);
    }
  }

  return possibleRoutes;
};

// Select best route based on minimum distance

const findBestRoute = (routes, distanceMap) => {
  let bestRoute = null;

  let minimumDistance = Infinity;

  for (const route of routes) {
    const key = JSON.stringify(route);

    const distance = distanceMap[key];

    if (distance < minimumDistance) {
      minimumDistance = distance;

      bestRoute = route;
    }
  }

  return {
    route: bestRoute,

    distance: minimumDistance,
  };
};

module.exports = {
  calculateDetour,

  isDetourAcceptable,

  isRouteCompatible,

  insertPassengerRoute,

  generatePossibleRoutes,

  findBestRoute,
};
