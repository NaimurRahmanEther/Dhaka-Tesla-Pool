const tripService = require("./trip.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");


const getActiveTrip = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const result = await tripService.getActiveTrip(driverId);
  return successResponse(res, 200, "Active trip fetched successfully", result);
});


const arriveTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.arriveTrip(poolId, driverId);
  return successResponse(res, 200, "Driver arrived successfully", result);
});


const startTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.startTrip(poolId, driverId);
  return successResponse(res, 200, "Trip started successfully", result);
});


const completeTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.completeTrip(poolId, driverId);
  return successResponse(res, 200, "Trip completed successfully", result);
});

module.exports = {
  getActiveTrip,
  arriveTrip,
  startTrip,
  completeTrip,
};
