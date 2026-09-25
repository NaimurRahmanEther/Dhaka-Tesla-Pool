const router =
require("express").Router();


const controller =
require("./history.controller");


const authMiddleware =
require("../../middleware/auth.middleware");





// Passenger ride history

router.get(

    "/passenger",

    authMiddleware,

    controller.getPassengerHistory

);





// Driver trip history

router.get(

    "/driver",

    authMiddleware,

    controller.getDriverHistory

);





module.exports = router;