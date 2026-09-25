const poolingService = require("./pooling.service");

const asyncHandler =
require("../../middleware/asyncHandler");

const successResponse =
require("../../utils/response");

const rideRepository =
require("../rides/ride.repository");

const AppError =
require("../../utils/AppError");



const addPassengerToPool = asyncHandler(
async(req,res)=>{


    const poolId =
    Number(req.params.poolId);


    const rideId =
    Number(req.body.rideId);

  console.log(rideId)

    const ride =
    await rideRepository.findRideById(
        rideId
    );



    if(!ride){

        throw new AppError(
            "Ride not found",
            404
        );

    }




    const result =
    await poolingService.addPassengerToPool({

        poolId,

        ride

    });




    return successResponse(

        res,

        200,

        "Passenger added to pool successfully",

        result

    );


});



module.exports = {

    addPassengerToPool

};