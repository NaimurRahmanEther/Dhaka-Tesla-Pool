const router = require("express").Router();

const controller = require("./route.controller");

const authMiddleware = require("../../middleware/auth.middleware");

// Generate driver route

router.post("/", authMiddleware, controller.createRoute);

// Get current route

router.get("/me", authMiddleware, controller.getMyRoute);

module.exports = router;
