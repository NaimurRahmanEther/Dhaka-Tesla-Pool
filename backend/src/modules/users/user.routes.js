const router = require("express").Router();

const controller = require("./user.controller");

const authMiddleware = require("../../middleware/auth.middleware");

const validate = require("../../middleware/validate.middleware");

const { updateUserSchema } = require("./user.validation");

console.log(updateUserSchema)

router.get(
  "/me",

  authMiddleware,

  controller.getProfile,
);

router.patch(
  "/me",

  authMiddleware,

  validate(updateUserSchema),

  controller.updateProfile,
);

module.exports = router;
