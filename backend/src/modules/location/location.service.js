const locationRepository = require("./location.repository");

const AppError = require("../../utils/AppError");

const getAllLocations = async () => {
  return locationRepository.findAllLocations();
};

const getLocationById = async (id) => {
  const location = await locationRepository.findLocationById(id);

  if (!location) {
    throw new AppError("Location not found", 404);
  }

  return location;
};

module.exports = {
  getAllLocations,
  getLocationById,
};
