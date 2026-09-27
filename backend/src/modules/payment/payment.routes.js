const router = require("express").Router();

const controller = require("./payment.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { createPaymentSchema } = require("./payment.validation");

router.post(
  "/:rideId",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  validate(createPaymentSchema),
  controller.makePayment,
);

// Payment history for the signed-in passenger
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("PASSENGER"),
  controller.getMyPayments,
);

module.exports = router;
