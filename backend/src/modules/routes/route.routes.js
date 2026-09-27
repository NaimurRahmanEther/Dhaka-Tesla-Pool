const router = require("express").Router();

const controller = require("./route.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { createRouteSchema } = require("./route.validation");

// Generate driver route

router.post(
  "/",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(createRouteSchema),
  controller.createRoute,
);

// Get current route

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getMyRoute,
);

module.exports = router;
