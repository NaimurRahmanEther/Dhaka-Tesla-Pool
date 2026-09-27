const router = require("express").Router();

const controller = require("./pooling.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { addPassengerSchema } = require("./pooling.validation");

router.post(
  "/:poolId/add-passenger",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  validate(addPassengerSchema),
  controller.addPassengerToPool,
);

router.get(
  "/:poolId/passengers",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getPoolPassengers,
);

module.exports = router;
