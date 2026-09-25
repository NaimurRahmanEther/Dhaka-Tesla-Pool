const pool = require("../../database/db");

// Find available Tesla drivers

const findAvailableVehicles = async () => {
  const result = await pool.query(
    `
        SELECT

            vehicles.id AS vehicle_id,

            vehicles.capacity,

            vehicles.driver_id,


            users.name AS driver_name


        FROM vehicles


        JOIN users

        ON vehicles.driver_id = users.id


        WHERE vehicles.status='ONLINE'

        `,
  );

  return result.rows;
};

// Find active pool of vehicle

const findActivePoolByVehicleId = async (vehicleId) => {
  const result = await pool.query(
    `
        SELECT *

        FROM pools

        WHERE vehicle_id=$1

        AND status='ACTIVE'

        `,

    [vehicleId],
  );

  return result.rows[0];
};

// Create new pool

const createPool = async ({ vehicleId, driverId }) => {
  const result = await pool.query(
    `
        INSERT INTO pools
        (
            vehicle_id,
            driver_id,
            status
        )

        VALUES($1,$2,'ACTIVE')

        RETURNING *

        `,

    [vehicleId, driverId],
  );

  return result.rows[0];
};

// Add ride into pool

const addRideToPool = async ({ poolId, rideId, seatsAllocated }) => {
  const result = await pool.query(
    `
        INSERT INTO pool_rides
        (
            pool_id,
            ride_id,
            seats_allocated
        )

        VALUES($1,$2,$3)

        RETURNING *

        `,

    [poolId, rideId, seatsAllocated],
  );

  return result.rows[0];
};

// Update ride status

const updateRideStatus = async (rideId) => {
  const result = await pool.query(
    `
        UPDATE rides

        SET status='MATCHED'


        WHERE id=$1


        RETURNING *

        `,

    [rideId],
  );

  return result.rows[0];
};

// Assign ride to pool with transaction + concurrency control

const assignRideToPool = async ({
  vehicleId,

  driverId,

  rideId,

  seatsAllocated,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
            Lock vehicle row

            Prevents two passengers
            booking same Tesla seats
            at the same time
        */

    const vehicleResult = await client.query(
      `
            SELECT *

            FROM vehicles

            WHERE id=$1

            FOR UPDATE

            `,

      [vehicleId],
    );

    const vehicle = vehicleResult.rows[0];

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    /*
            Check current pool
        */

    let poolResult = await client.query(
      `
            SELECT *

            FROM pools

            WHERE vehicle_id=$1

            AND status='ACTIVE'

            `,

      [vehicleId],
    );

    let activePool = poolResult.rows[0];

    /*
            Create pool if driver
            does not have active pool
        */

    if (!activePool) {
      poolResult = await client.query(
        `
                INSERT INTO pools
                (
                    vehicle_id,
                    driver_id,
                    status
                )

                VALUES($1,$2,'ACTIVE')

                RETURNING *

                `,

        [vehicleId, driverId],
      );

      activePool = poolResult.rows[0];
    }

    /*
            Insert passenger ride
            into pool
        */

    const poolRideResult = await client.query(
      `
            INSERT INTO pool_rides
            (
                pool_id,
                ride_id,
                seats_allocated
            )

            VALUES($1,$2,$3)

            RETURNING *

            `,

      [activePool.id, rideId, seatsAllocated],
    );

    /*
            Update ride status

        */

    await client.query(
      `
            UPDATE rides

            SET status='MATCHED'

            WHERE id=$1

            `,

      [rideId],
    );

    await client.query("COMMIT");

    return poolRideResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findAvailableVehicles,

  findActivePoolByVehicleId,

  createPool,

  addRideToPool,

  updateRideStatus,

  assignRideToPool,
};
