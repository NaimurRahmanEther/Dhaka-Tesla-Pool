const router = require("express").Router();

const controller = require("./pooling.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { addPassengerSchema } = require("./pooling.validation");

// Scoped to PASSENGER so a driver cannot insert a ride into a pool; the
// service also checks the caller owns the ride.
router.post(
  "/:poolId/add-passenger",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  validate(addPassengerSchema),
  controller.addPassengerToPool,
);

// Driver view pool passengers. Scoped to DRIVER, and the service verifies the
// caller owns the pool so one driver cannot read another's manifest.
router.get(
  "/:poolId/passengers",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getPoolPassengers,
);

module.exports = router;
