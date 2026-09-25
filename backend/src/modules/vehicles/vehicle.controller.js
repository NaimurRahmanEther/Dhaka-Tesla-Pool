const vehicleService = require("./vehicle.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.user.id, req.body);
  return successResponse(res, 201, "Vehicle created successfully", vehicle);
});

const getMyVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getMyVehicle(req.user.id);
  return successResponse(res, 200, "Vehicle fetched successfully", vehicle);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(
    req.user.id,
    Number(req.params.id),
    req.body,
  );
  return successResponse(res, 200, "Vehicle updated successfully", vehicle);
});

const updateStatus = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateStatus(
    req.user.id,
    req.body.status,
  );
  return successResponse(
    res,
    200,
    "Vehicle status updated successfully",
    vehicle,
  );
});

module.exports = {
  createVehicle,
  getMyVehicle,
  updateVehicle,
  updateStatus,
};
