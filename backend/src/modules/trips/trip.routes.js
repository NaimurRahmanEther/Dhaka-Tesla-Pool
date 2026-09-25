const router =
require("express").Router();


const controller =
require("./trip.controller");


const authMiddleware =
require("../../middleware/auth.middleware");



router.get(

    "/my-active",

    authMiddleware,

    controller.getActiveTrip

);



module.exports = router;