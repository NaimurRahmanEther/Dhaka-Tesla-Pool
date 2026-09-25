const matchingService = require("./matching.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const rideRepository = require("../rides/ride.repository");

const AppError = require("../../utils/AppError");

const matchRide = asyncHandler(async (req, res) => {
  const rideId = Number(req.params.rideId);
  const ride = await rideRepository.findRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }
  if (ride.status !== "REQUESTED") {
    throw new AppError("Ride already processed", 400);
  }
  const result = await matchingService.matchRide(ride);
  return successResponse(res, 200, "Ride matched successfully", result);
});

module.exports = {
  matchRide,
};
