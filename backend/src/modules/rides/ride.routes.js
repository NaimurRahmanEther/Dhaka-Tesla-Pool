const router = require("express").Router();

const controller = require("./ride.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { createRideSchema } = require("./ride.validation");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  validate(createRideSchema),
  controller.createRide,
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  controller.getMyRides,
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  controller.cancelRide,
);

module.exports = router;
