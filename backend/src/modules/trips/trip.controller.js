const tripService =
require("./trip.service");


const asyncHandler =
require("../../middleware/asyncHandler");


const successResponse =
require("../../utils/response");





// Driver active trip

const getActiveTrip =
asyncHandler(async(req,res)=>{


    const driverId =
    req.user.id;



    const result =
    await tripService.getActiveTrip(

        driverId

    );



    return successResponse(

        res,

        200,

        "Active trip fetched successfully",

        result

    );

});






// Start trip

const startTrip =
asyncHandler(async(req,res)=>{


    const poolId =
    Number(req.params.poolId);



    const driverId =
    req.user.id;



    const result =
    await tripService.startTrip(

        poolId,

        driverId

    );



    return successResponse(

        res,

        200,

        "Trip started successfully",

        result

    );

});






// Complete trip

const completeTrip =
asyncHandler(async(req,res)=>{


    const poolId =
    Number(req.params.poolId);



    const driverId =
    req.user.id;



    const result =
    await tripService.completeTrip(

        poolId,

        driverId

    );



    return successResponse(

        res,

        200,

        "Trip completed successfully",

        result

    );

});





module.exports = {

    getActiveTrip,

    startTrip,

    completeTrip

};