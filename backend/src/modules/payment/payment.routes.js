const router =
require("express").Router();


const controller =
require("./payment.controller");


const authMiddleware =
require("../../middleware/auth.middleware");





router.post(

"/:rideId",

authMiddleware,

controller.makePayment

);





module.exports=router;