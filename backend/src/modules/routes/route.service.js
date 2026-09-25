const routeRepository = require("./routes.repository");

const AppError = require("../../utils/AppError");

const createRoute = async (driverId, data) => {
  return routeRepository.createDriverRoute({
    driverId,

    startLocationId: data.startLocationId,

    destinationLocationId: data.destinationLocationId,

    route: data.route,
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
