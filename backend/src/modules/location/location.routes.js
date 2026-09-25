const router = require("express").Router();

const controller = require("./location.controller");

router.get("/", controller.getAllLocations);

router.get("/:id", controller.getLocationById);

module.exports = router;
