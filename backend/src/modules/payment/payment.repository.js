const pool = require("../../database/db");

const createPayment = async ({ rideId, passengerId, amount, method }) => {
  const result = await pool.query(
    `
      INSERT INTO payments
      (
          ride_id,
          passenger_id,
          amount,
          method,
          status
      )
      VALUES
      (
          $1,
          $2,
          $3,
          $4,
          'PAID'
      )
      RETURNING *
    `,
    [rideId, passengerId, amount, method],
  );

  return result.rows[0];
};

const getPaymentByRideId = async (rideId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM payments
      WHERE ride_id=$1
      ORDER BY id DESC
      LIMIT 1
    `,
    [rideId],
  );

  return result.rows[0];
};

const findPaymentsByPassengerId = async (passengerId) => {
  const result = await pool.query(
    `
      SELECT
          payments.id,
          payments.ride_id,
          payments.amount,
          payments.method,
          payments.status,
          payments.created_at,
          pickup.name AS pickup_location,
          destination.name AS destination_location
      FROM payments
      JOIN rides
      ON payments.ride_id = rides.id
      JOIN locations pickup
      ON rides.pickup_location_id = pickup.id
      JOIN locations destination
      ON rides.destination_location_id = destination.id
      WHERE payments.passenger_id=$1
      ORDER BY payments.created_at DESC
    `,
    [passengerId],
  );

  return result.rows;
};

module.exports = {
  createPayment,
  getPaymentByRideId,
  findPaymentsByPassengerId,
};
