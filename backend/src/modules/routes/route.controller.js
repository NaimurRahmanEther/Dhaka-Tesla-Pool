const routeService = require("./route.service");

const asyncHandler = require("../../middleware/asyncHandler");

const successResponse = require("../../utils/response");

const createRoute = asyncHandler(async (req, res) => {
  const route = await routeService.createRoute(req.user.id, req.body);
  return successResponse(res, 201, "Driver route created successfully", route);
});

const getMyRoute = asyncHandler(async (req, res) => {
  const route = await routeService.getDriverRoute(req.user.id);
  return successResponse(res, 200, "Driver route fetched successfully", route);
});

module.exports = {
  createRoute,
  getMyRoute,
};
