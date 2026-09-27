const router = require("express").Router();

const controller = require("./trip.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

// Driver active trip

router.get(
  "/my-active",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getActiveTrip,
);

// Driver arrived at pickup

router.patch(
  "/:poolId/arrive",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.arriveTrip,
);

// Start trip

router.patch(
  "/:poolId/start",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.startTrip,
);

// Complete trip

router.patch(
  "/:poolId/complete",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.completeTrip,
);

module.exports = router;
