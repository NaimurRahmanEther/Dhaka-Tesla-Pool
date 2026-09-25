const rideService = require("./ride.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const createRide = asyncHandler(async (req, res) => {
  const ride = await rideService.createRide(req.user.id, req.body);
  return successResponse(res, 201, "Ride requested successfully", ride);
});

const getMyRides = asyncHandler(async (req, res) => {
  const rides = await rideService.getMyRides(req.user.id);
  return successResponse(res, 200, "Rides fetched successfully", rides);
});

const cancelRide = asyncHandler(async (req, res) => {
  const ride = await rideService.cancelRide(req.user.id, Number(req.params.id));
  return successResponse(res, 200, "Ride cancelled successfully", ride);
});

module.exports = {
  createRide,
  getMyRides,
  cancelRide,
};
