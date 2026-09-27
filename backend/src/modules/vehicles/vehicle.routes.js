const router = require("express").Router();

const controller = require("./vehicle.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const {
  createVehicleSchema,
  updateVehicleSchema,
  updateStatusSchema,
} = require("./vehicle.validation");

// Create Tesla

router.post(
  "/",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(createVehicleSchema),
  controller.createVehicle,
);

// Get driver's Tesla

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getMyVehicle,
);

// Online/offline

router.patch(
  "/status",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(updateStatusSchema),
  controller.updateStatus,
);

// Update Tesla information

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(updateVehicleSchema),
  controller.updateVehicle,
);

module.exports = router;
