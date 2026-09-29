const paymentRepository = require("./payment.repository");
const AppError = require("../../utils/AppError");

const makePayment = async ({ ride, method }) => {
  // Postgres NUMERIC arrives as a string, so the fare is coerced before it is
  // compared. A string of "0.00" is truthy, which would otherwise let an
  // unpayable ride through the check below.
  const fare = Number(ride.fare);

  if (!Number.isFinite(fare) || fare <= 0) {
    throw new AppError("Ride fare not available", 400);
  }

  if (ride.status !== "COMPLETED") {
    throw new AppError("Ride must be completed before payment", 400);
  }

  // One settled payment per ride. Without this the endpoint could be called
  // twice and produce two PAID rows for the same fare.
  const existing = await paymentRepository.getPaymentByRideId(ride.id);

  if (existing && existing.status === "PAID") {
    throw new AppError("Ride has already been paid", 409);
  }

  const payment = await paymentRepository.createPayment({
    rideId: ride.id,
    passengerId: ride.passenger_id,
    amount: fare,
    method,
  });

  return payment;
};

const getMyPayments = async (passengerId) => {
  return paymentRepository.findPaymentsByPassengerId(passengerId);
};

module.exports = {
  makePayment,
  getMyPayments,
};
