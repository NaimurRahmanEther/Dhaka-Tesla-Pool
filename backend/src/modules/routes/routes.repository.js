const pool = require("../../database/db");
const AppError = require("../../utils/AppError");

// Save driver calculated route

const createDriverRoute = async ({
  driverId,
  startLocationId,
  destinationLocationId,
  route,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT id FROM vehicles WHERE driver_id=$1 FOR UPDATE",
      [driverId],
    );
    const active = await client.query(
      "SELECT id FROM pools WHERE driver_id=$1 AND status='ACTIVE'",
      [driverId],
    );
    if (active.rows.length) {
      throw new AppError(
        "Complete your active trip before planning the next route",
        409,
      );
    }
    await client.query(
      "UPDATE vehicles SET current_location_id=$1 WHERE driver_id=$2",
      [startLocationId, driverId],
    );
    const result = await client.query(
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

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Get latest driver route

const findRouteByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM driver_routes
      WHERE driver_id=$1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [driverId],
  );

  return result.rows[0];
};

// A completed trip consumes its plan; the driver manually plans the next one.
const findAvailableRoute = async (driverId, locationId) => {
  const result = await pool.query(
    `
      SELECT * FROM driver_routes
      WHERE driver_id=$1 AND start_location_id=$2
        AND created_at > COALESCE(
          (SELECT MAX(completed_at) FROM pools WHERE driver_id=$1), '-infinity'::timestamp
        )
      ORDER BY created_at DESC, id DESC LIMIT 1
    `,
    [driverId, locationId],
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
  findAvailableRoute,
};
