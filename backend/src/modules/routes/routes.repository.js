const pool = require("../../database/db");

// Save driver calculated route

const createDriverRoute = async ({
  driverId,
  startLocationId,
  destinationLocationId,
  route,
}, client = pool) => {
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

  return result.rows[0];
};

// Get latest driver route

const findRouteByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT * FROM (
        SELECT pools.id, pools.driver_id,
          vehicles.current_location_id AS start_location_id,
          (pools.current_route->'path'->>-1)::integer AS destination_location_id,
          COALESCE(pools.current_route, jsonb_build_object('path', jsonb_build_array(vehicles.current_location_id), 'distance', 0)) AS route,
          pools.route_updated_at AS created_at, TRUE AS locked,
          pools.id AS pool_id
        FROM pools JOIN vehicles ON vehicles.id=pools.vehicle_id
        WHERE pools.driver_id=$1 AND pools.status='ACTIVE'
        UNION ALL
        SELECT id, driver_id, start_location_id, destination_location_id,
          route, created_at, FALSE AS locked, NULL::integer AS pool_id
        FROM driver_routes
        WHERE driver_id=$1 AND created_at > COALESCE(
          (SELECT MAX(created_at) FROM pools WHERE driver_id=$1), '-infinity'::timestamp
        )
      ) AS available_routes
      ORDER BY locked DESC, created_at DESC, id DESC LIMIT 1
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
