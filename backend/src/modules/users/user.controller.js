const userService =
require("./user.service");


const successResponse =
require("../../utils/response");


const asyncHandler =
require("../../middleware/asyncHandler");





const getProfile = asyncHandler(
async(req,res)=>{


    const user =
    await userService.getProfile(
        req.user.id
    );


    return successResponse(

        res,

        200,

        "Profile fetched successfully",

        user

    );


});





const updateProfile = asyncHandler(
async(req,res)=>{


    const user =
    await userService.updateProfile(

        req.user.id,

        req.body

    );



    return successResponse(

        res,

        200,

        "Profile updated successfully",

        user

    );


});





module.exports={

    getProfile,

    updateProfile

};