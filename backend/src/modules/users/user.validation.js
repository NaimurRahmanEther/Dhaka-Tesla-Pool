const {z}=require("zod");



const updateUserSchema = z.object({

    name:

    z.string()
    .min(
        3,
        "Name must contain at least 3 characters"
    )
    .optional(),


    email:

    z.string()
    .email(
        "Invalid email format"
    )
    .optional()

});



module.exports={
    updateUserSchema
};