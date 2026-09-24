const userRepository =
require("./user.repository");


const AppError =
require("../../utils/AppError");





const getProfile = async(userId)=>{


    const user =
    await userRepository.findUserById(
        userId
    );


    if(!user){

        throw new AppError(
            "User not found",
            404
        );

    }


    return user;

};





const updateProfile = async(
    userId,
    data
)=>{


    const user =
    await userRepository.findUserById(
        userId
    );


    if(!user){

        throw new AppError(
            "User not found",
            404
        );

    }



    const updatedData={

        name:
        data.name || user.name,


        email:
        data.email || user.email

    };



    return userRepository.updateUser(

        userId,

        updatedData

    );

};





module.exports={

    getProfile,

    updateProfile

};