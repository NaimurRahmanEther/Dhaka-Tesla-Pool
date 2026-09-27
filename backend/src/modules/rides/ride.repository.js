const pool = require("../../database/db");

// Create ride request

const createRide = async ({
  passengerId,
  pickupLocationId,
  destinationLocationId,
  seatsRequested,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
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

    const ride = result.rows[0];

    // The opening event of the audit trail. Without it a ride's history starts
    // mid-story and cannot explain how the request came about.
    await client.query(
      `
        INSERT INTO ride_history (ride_id, actor_id, action)
        VALUES($1,$2,'REQUESTED')
      `,
      [ride.id, passengerId],
    );

    await client.query("COMMIT");

    return ride;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
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
        SET
            status='CANCELLED',
            cancelled_at=CURRENT_TIMESTAMP
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

// Is this ride being served by one of the driver's pools? Used to authorise
// reads of a ride's timeline.
const isRideInDriverPool = async (rideId, driverId) => {
  const result = await pool.query(
    `
      SELECT 1
      FROM pool_rides
      JOIN pools
      ON pools.id = pool_rides.pool_id
      WHERE pool_rides.ride_id=$1
      AND pools.driver_id=$2
      LIMIT 1
    `,
    [rideId, driverId],
  );

  return result.rows.length > 0;
};

module.exports = {
  createRide,
  findRidesByPassengerId,
  findRideById,
  cancelRide,
  isRideInDriverPool,
};
