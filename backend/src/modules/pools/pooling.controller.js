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
  // A passenger may only add their own unclaimed ride to a pool.
  if (ride.passenger_id !== req.user.id) {
    throw new AppError("You cannot add another passenger's ride", 403);
  }
  if (ride.status !== "REQUESTED") {
    throw new AppError("Ride is not open for pooling", 400);
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
  const result = await poolingService.getPoolPassengers(poolId, req.user.id);
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
