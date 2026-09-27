const router = require("express").Router();

const controller = require("./matching.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validate.middleware");
const { acceptRideSchema } = require("./matching.validation");

// Declare /requests before /:rideId so it is not treated as an ID.
router.get(
  "/requests",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.listOpenRequests,
);

router.post(
  "/:rideId/accept",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(acceptRideSchema),
  controller.acceptRide,
);

router.post(
  "/:rideId",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.matchRide,
);

module.exports = router;
