const historyService =
require("./history.service");


const asyncHandler =
require("../../middleware/asyncHandler");


const successResponse =
require("../../utils/response");





// Passenger history

const getPassengerHistory =
asyncHandler(async(req,res)=>{


    const passengerId =
    req.user.id;



    const result =
    await historyService.getPassengerHistory(

        passengerId

    );



    return successResponse(

        res,

        200,

        "Passenger history fetched successfully",

        result

    );


});







// Driver history

const getDriverHistory =
asyncHandler(async(req,res)=>{


    const driverId =
    req.user.id;



    const result =
    await historyService.getDriverHistory(

        driverId

    );



    return successResponse(

        res,

        200,

        "Driver history fetched successfully",

        result

    );


});





module.exports={

    getPassengerHistory,

    getDriverHistory

};