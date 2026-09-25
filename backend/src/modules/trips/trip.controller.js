const tripService = require("./trip.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

// Driver view active pool

const getActiveTrip = asyncHandler(async (req, res) => {
  const driverId = req.user.id;

  const trip = await tripService.getActiveTrip(driverId);

  return successResponse(
    res,

    200,

    "Active trip fetched successfully",

    trip,
  );
});

module.exports = {
  getActiveTrip,
};
