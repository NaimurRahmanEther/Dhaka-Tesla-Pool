const router = require("express").Router();

const controller = require("./history.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

// Passenger ride history

router.get(
  "/passenger",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  controller.getPassengerHistory,
);

// Driver trip history

router.get(
  "/driver",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getDriverHistory,
);

module.exports = router;
