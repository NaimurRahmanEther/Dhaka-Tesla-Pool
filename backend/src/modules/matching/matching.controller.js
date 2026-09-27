const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const matchingService = require("./matching.service");

const rideRepository = require("../rides/ride.repository");
const vehicleRepository = require("../vehicles/vehicle.repository");

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

  const driverVehicle = await vehicleRepository.findVehicleByDriverId(
    req.user.id,
  );

  if (!driverVehicle) {
    throw new AppError("Register a Tesla before matching rides", 403);
  }

  if (driverVehicle.status !== "ONLINE") {
    throw new AppError("Go online before matching rides", 403);
  }

  const result = await matchingService.matchRide(ride);

  return successResponse(res, 200, "Ride matched successfully", result);
});

const listOpenRequests = asyncHandler(async (req, res) => {
  const requests = await matchingService.listOpenRequests(req.user.id);

  return successResponse(
    res,
    200,
    "Open ride requests fetched successfully",
    requests,
  );
});

const acceptRide = asyncHandler(async (req, res) => {
  const rideId = Number(req.params.rideId);
  const ride = await rideRepository.findRideById(rideId);

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (ride.status !== "REQUESTED") {
    throw new AppError("Ride already processed", 409);
  }

  const result = await matchingService.acceptRide(ride, req.user.id, req.body);

  return successResponse(res, 200, "Ride accepted successfully", result);
});

module.exports = {
  matchRide,
  listOpenRequests,
  acceptRide,
};
