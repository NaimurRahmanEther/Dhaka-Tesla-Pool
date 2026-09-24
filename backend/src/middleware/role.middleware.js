const AppError =
require("../utils/AppError");



const roleMiddleware = (...allowedRoles)=>{


    return (req,res,next)=>{


        if(!allowedRoles.includes(req.user.role)){


            return next(

                new AppError(
                    "You do not have permission",
                    403
                )

            );

        }



        next();


    };


};



module.exports = roleMiddleware;