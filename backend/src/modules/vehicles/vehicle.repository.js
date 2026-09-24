const pool = require("../../database/db");

// Create vehicle
const createVehicle = async ({ driverId, model, capacity }) => {
  const result = await pool.query(
    `
        INSERT INTO vehicles
        (
            driver_id,
            model,
            capacity
        )

        SELECT
            id,
            $2,
            $3

        FROM users

        WHERE id = $1
        AND role = 'DRIVER'

        RETURNING *
    `,
    [driverId, model, capacity],
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

// Update vehicle

const updateVehicle = async (id, { model, capacity }) => {
  const result = await pool.query(
    `
        UPDATE vehicles

        SET
            model=$1,
            capacity=$2


        WHERE id=$3


        RETURNING *

        `,

    [model, capacity, id],
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

  updateVehicle,

  updateVehicleStatus,
};
