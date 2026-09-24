const AppError =
require("../utils/AppError");


const validate = (schema)=>{

    return (req,res,next)=>{


        const result =
        schema.safeParse(req.body);



        if(!result.success){


            throw new AppError(

                result.error.errors[0].message,

                400

            );

        }


        req.body=result.data;


        next();

    };

};


module.exports=validate;