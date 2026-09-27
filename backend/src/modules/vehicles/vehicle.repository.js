const pool = require("../../database/db");

// Create vehicle

const createVehicle = async ({
  driverId,
  model,
  capacity,
  currentLocationId,
}) => {
  const result = await pool.query(
    `
      INSERT INTO vehicles
      (
          driver_id,
          model,
          capacity,
          current_location_id
      )
      SELECT
          id,
          $2,
          $3,
          $4
      FROM users
      WHERE id=$1
      AND role='DRIVER'
      RETURNING *
    `,
    [driverId, model, capacity, currentLocationId],
  );

  return result.rows[0];
};

// Find vehicle by driver

const findVehicleByDriverId = async (driverId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM vehicles
      WHERE driver_id=$1
    `,
    [driverId],
  );

  return result.rows[0];
};

// Find vehicle by id

const findVehicleById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM vehicles
      WHERE id=$1
    `,
    [id],
  );

  return result.rows[0];
};

// Seats already booked across this vehicle's active pools
const getActivePoolOccupiedSeats = async (vehicleId) => {
  const result = await pool.query(
    `
      SELECT COALESCE(MAX(occupied), 0) AS busiest
      FROM (
          SELECT SUM(pool_rides.seats_allocated) AS occupied
          FROM pool_rides
          JOIN pools
          ON pools.id = pool_rides.pool_id
          WHERE pools.vehicle_id=$1
          AND pools.status='ACTIVE'
          GROUP BY pool_rides.pool_id
      ) AS per_pool
    `,
    [vehicleId],
  );

  return Number(result.rows[0].busiest);
};

// Update vehicle

const updateVehicle = async (id, { model, capacity, currentLocationId }) => {
  const result = await pool.query(
    `
      UPDATE vehicles
      SET
          model=COALESCE($1,model),
          capacity=COALESCE($2,capacity),
          current_location_id=
          COALESCE($3,current_location_id)
      WHERE id=$4
      RETURNING *
    `,
    [model, capacity, currentLocationId, id],
  );

  return result.rows[0];
};

// Update status

const updateVehicleStatus = async (driverId, status) => {
  const result = await pool.query(
    `
      UPDATE vehicles
      SET status=$1
      WHERE driver_id=$2
      RETURNING *
    `,
    [status, driverId],
  );

  return result.rows[0];
};

module.exports = {
  createVehicle,
  findVehicleByDriverId,
  findVehicleById,
  getActivePoolOccupiedSeats,
  updateVehicle,
  updateVehicleStatus,
};
