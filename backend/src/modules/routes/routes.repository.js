const pool = require("../../database/db");

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

module.exports = {
  createDriverRoute,

  findRouteByDriverId,
};
