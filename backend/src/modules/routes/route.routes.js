const router = require("express").Router();

const controller = require("./route.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const validate = require("../../middleware/validate.middleware");

const { createRouteSchema } = require("./route.validation");


router.post(
  "/",
  authMiddleware,
  roleMiddleware("DRIVER"),
  validate(createRouteSchema),
  controller.createRoute,
);


router.get(
  "/me",
  authMiddleware,
  roleMiddleware("DRIVER"),
  controller.getMyRoute,
);

module.exports = router;
