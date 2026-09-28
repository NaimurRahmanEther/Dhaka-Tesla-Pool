const tripService = require("./trip.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

// Driver active trip

const getActiveTrip = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const result = await tripService.getActiveTrip(driverId);
  return successResponse(res, 200, "Active trip fetched successfully", result);
});

// Driver arrived

const arriveTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.arriveTrip(poolId, driverId);
  return successResponse(res, 200, "Driver arrived successfully", result);
});

// Start trip

const startTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.startTrip(poolId, driverId);
  return successResponse(res, 200, "Trip started successfully", result);
});

// Complete trip

const completeTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const driverId = req.user.id;
  const result = await tripService.completeTrip(poolId, driverId);
  return successResponse(res, 200, "Trip completed successfully", result);
});

const cancelTrip = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  if (!Number.isInteger(poolId) || poolId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid pool ID" });
  }
  const result = await tripService.cancelTrip(poolId, req.user.id);
  return successResponse(res, 200, "Trip cancelled successfully", result);
});

module.exports = {
  updatePassenger: asyncHandler(async (req, res) => {
    const poolId = Number(req.params.poolId);
    const rideId = Number(req.params.rideId);
    const { action } = req.params;
    if (![poolId, rideId].every((id) => Number.isInteger(id) && id > 0) || !["arrive", "start", "cancel"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid passenger action" });
    }
    const result = await tripService.updatePassenger(poolId, rideId, req.user.id, action);
    return successResponse(res, 200, "Passenger ride updated", result);
  }),
  cancelTrip,
  getActiveTrip,
  arriveTrip,
  startTrip,
  completeTrip,
};
