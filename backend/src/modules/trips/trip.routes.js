const router =
require("express").Router();


const controller =
require("./trip.controller");


const authMiddleware =
require("../../middleware/auth.middleware");




// Driver active trip

router.get(

    "/my-active",

    authMiddleware,

    controller.getActiveTrip

);





// Start trip

router.patch(

    "/:poolId/start",

    authMiddleware,

    controller.startTrip

);





// Complete trip

router.patch(

    "/:poolId/complete",

    authMiddleware,

    controller.completeTrip

);



module.exports = router;