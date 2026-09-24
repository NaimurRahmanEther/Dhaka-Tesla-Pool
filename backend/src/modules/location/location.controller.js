const locationService = require("./location.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await locationService.getAllLocations();

  return successResponse(
    res,

    200,

    "Locations fetched successfully",

    locations,
  );
});

const getLocationById = asyncHandler(async (req, res) => {
  const location = await locationService.getLocationById(Number(req.params.id));

  return successResponse(
    res,

    200,

    "Location fetched successfully",

    location,
  );
});

module.exports = {
  getAllLocations,

  getLocationById,
};
