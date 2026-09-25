const router = require("express").Router();

const controller = require("./pooling.controller");

const authMiddleware = require("../../middleware/auth.middleware");

// Add passenger to existing pool

router.post(
  "/:poolId/add-passenger",
  authMiddleware,
  controller.addPassengerToPool,
);

// Driver view pool passengers

router.get("/:poolId/passengers", authMiddleware, controller.getPoolPassengers);

module.exports = router;
