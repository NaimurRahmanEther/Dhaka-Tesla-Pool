const router =
require("express").Router();


const controller =
require("./matching.controller");


const authMiddleware =
require("../../middleware/auth.middleware");



router.post(

"/:rideId",

authMiddleware,

controller.matchRide

);



module.exports = router;