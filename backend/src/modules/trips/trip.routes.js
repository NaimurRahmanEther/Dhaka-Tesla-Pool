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
  (req, res) => res.status(409).json({ success: false, message: "Mark arrival for each passenger separately" }),
);

// Start trip

router.patch(
  "/:poolId/start",
  authMiddleware,
  roleMiddleware("DRIVER"),
  (req, res) => res.status(409).json({ success: false, message: "Start each passenger ride separately" }),
);

// Complete trip

router.patch(
  "/:poolId/complete",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.completeTrip,
);

router.patch("/:poolId/cancel", authMiddleware, roleMiddleware("DRIVER"), controller.cancelTrip);
router.patch("/:poolId/rides/:rideId/:action", authMiddleware, roleMiddleware("DRIVER"), controller.updatePassenger);

module.exports = router;
