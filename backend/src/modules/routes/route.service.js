const routeRepository = require("./routes.repository");

const graphService = require("../graph/graph.service");

const AppError = require("../../utils/AppError");
const pool = require("../../database/db");

const createRoute = async (driverId, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query("SELECT * FROM vehicles WHERE driver_id=$1 FOR UPDATE", [driverId]);
    const vehicle = found.rows[0];

    if (!vehicle) {
      throw new AppError("Driver vehicle not found", 404);
    }
    const active = await client.query("SELECT 1 FROM pools WHERE vehicle_id=$1 AND status='ACTIVE'", [vehicle.id]);
    if (active.rows.length) throw new AppError("Complete your trip or cancel the empty pool before changing your location or destination", 409);
    const start = data.currentLocationId ?? vehicle.current_location_id;
    if (start === data.destinationLocationId) throw new AppError("Choose a destination different from your current location", 400);

    const route = await graphService.calculateDriverRoute({
      currentLocationId: start,
      pickupLocationId: start,
      destinationLocationId: data.destinationLocationId,
    });

    if (!route) {
      throw new AppError("Route calculation failed", 400);
    }

    await client.query("UPDATE vehicles SET current_location_id=$1 WHERE id=$2", [start, vehicle.id]);
    const saved = await routeRepository.createDriverRoute({
      driverId,
      startLocationId: start,
      destinationLocationId: data.destinationLocationId,
      route,
    }, client);
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
