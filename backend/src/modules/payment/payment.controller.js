const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const paymentService = require("./payment.service");

const rideRepository = require("../rides/ride.repository");

const makePayment = asyncHandler(async (req, res) => {
  const rideId = Number(req.params.rideId);
  const ride = await rideRepository.findRideById(rideId);
  const payment = await paymentService.makePayment({
    ride,
    method: req.body.method,
  });
  return successResponse(res, 201, "Payment successful", payment);
});

module.exports = {
  makePayment,
};
