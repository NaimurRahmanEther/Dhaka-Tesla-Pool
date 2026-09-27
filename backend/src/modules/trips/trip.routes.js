const router = require("express").Router();

const controller = require("./trip.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");


router.get(
  "/my-active",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getActiveTrip,
);


router.patch(
  "/:poolId/arrive",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.arriveTrip,
);


router.patch(
  "/:poolId/start",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.startTrip,
);


router.patch(
  "/:poolId/complete",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.completeTrip,
);

module.exports = router;
