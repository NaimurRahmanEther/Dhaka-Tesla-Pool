const matchingService = require("./matching.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const rideRepository = require("../rides/ride.repository");

const matchRide = asyncHandler(async (req, res) => {
  const rideId = Number(req.params.rideId);

  const ride = await rideRepository.findRideById(rideId);

  const result = await matchingService.matchRide(ride);

  return successResponse(
    res,

    200,

    "Ride matched successfully",

    result,
  );
});

module.exports = {
  matchRide,
};
