const vehicleRepository = require("./vehicle.repository");

const AppError = require("../../utils/AppError");

// Driver creates Tesla

const createVehicle = async (driverId, data) => {
  const existingVehicle =
    await vehicleRepository.findVehicleByDriverId(driverId);

  if (existingVehicle) {
    throw new AppError("Driver already has a vehicle", 400);
  }

  return vehicleRepository.createVehicle({
    driverId,

    model: data.model,

    capacity: data.capacity,

    currentLocationId: data.currentLocationId,
  });
};

const getMyVehicle = async (driverId) => {
  const vehicle = await vehicleRepository.findVehicleByDriverId(driverId);

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  return vehicle;
};

const updateVehicle = async (driverId, vehicleId, data) => {
  const vehicle = await vehicleRepository.findVehicleById(vehicleId);

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  if (vehicle.driver_id !== driverId) {
    throw new AppError("You cannot update this vehicle", 403);
  }

  return vehicleRepository.updateVehicle(vehicleId, data);
};

const updateStatus = async (driverId, status) => {
  const vehicle = await vehicleRepository.findVehicleByDriverId(driverId);

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  return vehicleRepository.updateVehicleStatus(driverId, status);
};

module.exports = {
  createVehicle,

  getMyVehicle,

  updateVehicle,

  updateStatus,
};
