const router = require("express").Router();

const controller = require("./route.controller");

const authMiddleware = require("../../middleware/auth.middleware");

router.post(
  "/",

  authMiddleware,

  controller.createRoute,
);

router.get(
  "/me",

  authMiddleware,

  controller.getMyRoute,
);

module.exports = router;
