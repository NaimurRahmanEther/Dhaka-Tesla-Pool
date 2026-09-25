const router = require("express").Router();

const controller = require("./pooling.controller");

const authMiddleware = require("../../middleware/auth.middleware");

router.post(
  "/:poolId/add-passenger",

  authMiddleware,

  controller.addPassengerToPool,
);

module.exports = router;
