const router = require("express").Router();

const controller = require("./matching.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validate.middleware");
const { acceptRideSchema } = require("./matching.validation");

// Everything here is a driver-side action. Previously any authenticated user,
// including a passenger, could force a ride into a pool.

// Open requests this driver could take. Declared before "/:rideId" so it is not
// swallowed by the parameterised route.
router.get(
  "/requests",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.listOpenRequests,
);

// A driver accepts one specific request with their own Tesla. This is the
// hand-off path a real driver uses; the route below is the automatic one.
router.post(
  "/:rideId/accept",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(acceptRideSchema),
  controller.acceptRide,
);

// Automatic matching: the system picks the best available Tesla.
router.post(
  "/:rideId",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.matchRide,
);

module.exports = router;
