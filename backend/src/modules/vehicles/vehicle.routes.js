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


router.post(
  "/",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(createVehicleSchema),
  controller.createVehicle,
);


router.get(
  "/me",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getMyVehicle,
);


router.patch(
  "/status",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(updateStatusSchema),
  controller.updateStatus,
);


router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(updateVehicleSchema),
  controller.updateVehicle,
);

module.exports = router;
