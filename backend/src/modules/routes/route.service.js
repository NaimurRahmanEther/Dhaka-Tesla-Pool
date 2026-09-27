const routeRepository = require("./routes.repository");

const graphService = require("../graph/graph.service");

const AppError = require("../../utils/AppError");

const createRoute = async (driverId, data) => {
  const vehicle = await routeRepository.findDriverLocation(driverId);

  if (!vehicle) {
    throw new AppError("Driver vehicle not found", 404);
  }

  const startLocationId = data.currentLocationId ?? vehicle.current_location_id;
  if (startLocationId === data.destinationLocationId) {
    throw new AppError("Choose a destination different from your current location", 400);
  }
  const route = await graphService.shortestPath(startLocationId, data.destinationLocationId);

  if (!route) {
    throw new AppError("Route calculation failed", 400);
  }

  return routeRepository.createDriverRoute({
    driverId,
    startLocationId,
    destinationLocationId: data.destinationLocationId,
    route,
  });
};

const getDriverRoute = async (driverId) => {
  const route = await routeRepository.findRouteByDriverId(driverId);

  if (!route) {
    throw new AppError("Driver route not found", 404);
  }

  return route;
};

module.exports = {
  createRoute,
  getDriverRoute,
};
