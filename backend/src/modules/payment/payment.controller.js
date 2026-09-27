const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const paymentService = require("./payment.service");

const rideRepository = require("../rides/ride.repository");

const AppError = require("../../utils/AppError");

const makePayment = asyncHandler(async (req, res) => {
  const rideId = Number(req.params.rideId);

  const ride = await rideRepository.findRideById(rideId);

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  // A passenger may only pay for their own ride; the role check alone would let
  // any passenger settle anybody else's fare.
  if (ride.passenger_id !== req.user.id) {
    throw new AppError("You cannot pay for another passenger's ride", 403);
  }

  const payment = await paymentService.makePayment({
    ride,
    method: req.body.method,
  });

  return successResponse(res, 201, "Payment successful", payment);
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getMyPayments(req.user.id);

  return successResponse(
    res,
    200,
    "Payments fetched successfully",
    payments,
  );
});

module.exports = {
  makePayment,
  getMyPayments,
};
