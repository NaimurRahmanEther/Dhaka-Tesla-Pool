const pool = require("../../database/db");

// Create ride request

const createRide = async ({
  passengerId,
  pickupLocationId,
  destinationLocationId,
  seatsRequested,
}) => {
  const result = await pool.query(
    `
      INSERT INTO rides
      (
          passenger_id,
          pickup_location_id,
          destination_location_id,
          seats_requested
      )
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,
    [passengerId, pickupLocationId, destinationLocationId, seatsRequested],
  );

  return result.rows[0];
};

// Get passenger rides

const findRidesByPassengerId = async (passengerId) => {
  const result = await pool.query(
    `
      SELECT
          rides.*,
          pickup.name AS pickup_location,
          destination.name AS destination_location
      FROM rides
      JOIN locations pickup
      ON rides.pickup_location_id = pickup.id
      JOIN locations destination
      ON rides.destination_location_id = destination.id
      WHERE rides.passenger_id=$1
      ORDER BY requested_at DESC
    `,
    [passengerId],
  );

  return result.rows;
};

// Find single ride

const findRideById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM rides
      WHERE id=$1
    `,
    [id],
  );

  return result.rows[0];
};

// Cancel ride transaction

const cancelRide = async ({ rideId, actorId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        DELETE FROM pool_rides
        WHERE ride_id=$1
      `,
      [rideId],
    );

    const rideResult = await client.query(
      `
        UPDATE rides
        SET status='CANCELLED'
        WHERE id=$1
        RETURNING *
      `,
      [rideId],
    );

    if (!rideResult.rows.length) {
      throw new Error("Ride cancellation failed");
    }

    await client.query(
      `
        INSERT INTO ride_history
        (
            ride_id,
            actor_id,
            action
        )
        VALUES($1,$2,'CANCELLED')
      `,
      [rideId, actorId],
    );

    await client.query("COMMIT");

    return rideResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createRide,
  findRidesByPassengerId,
  findRideById,
  cancelRide,
};
