const poolingService = require("./pooling.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const rideRepository = require("../rides/ride.repository");

const AppError = require("../../utils/AppError");

// Add passenger to pool

const addPassengerToPool = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const rideId = Number(req.body.rideId);
  const ride = await rideRepository.findRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }
  const result = await poolingService.addPassengerToPool({
    poolId,
    ride,
  });
  return successResponse(
    res,
    200,
    "Passenger added to pool successfully",
    result,
  );
});

// Get pool passengers for driver

const getPoolPassengers = asyncHandler(async (req, res) => {
  const poolId = Number(req.params.poolId);
  const result = await poolingService.getPoolPassengers(poolId);
  return successResponse(
    res,
    200,
    "Pool passengers fetched successfully",
    result,
  );
});

module.exports = {
  addPassengerToPool,
  getPoolPassengers,
};
