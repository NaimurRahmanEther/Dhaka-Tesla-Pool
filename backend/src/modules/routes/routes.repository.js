const pool = require("../../database/db");

// Save driver calculated route

const createDriverRoute = async ({
  driverId,
  startLocationId,
  destinationLocationId,
  route,
}) => {
  const result = await pool.query(
    `
      INSERT INTO driver_routes
      (
          driver_id,
          start_location_id,
          destination_location_id,
          route
      )
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,
    [driverId, startLocationId, destinationLocationId, JSON.stringify(route)],
  );

  return result.rows[0];
};

// Get latest driver route

const findRouteByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM driver_routes
      WHERE driver_id=$1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [driverId],
  );

  return result.rows[0];
};

// Get driver current location

const findDriverLocation = async (driverId) => {
  const result = await pool.query(
    `
      SELECT
          current_location_id
      FROM vehicles
      WHERE driver_id=$1
    `,
    [driverId],
  );

  return result.rows[0];
};

module.exports = {
  createDriverRoute,
  findRouteByDriverId,
  findDriverLocation,
};
