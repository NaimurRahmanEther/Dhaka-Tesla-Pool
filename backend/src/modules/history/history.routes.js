const router = require("express").Router();

const controller = require("./history.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");


router.get(
  "/passenger",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  controller.getPassengerHistory,
);


router.get(
  "/driver",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getDriverHistory,
);

module.exports = router;
