const paymentRepository =
require("./payment.repository");


const AppError =
require("../../utils/AppError");






const makePayment = async({

    ride,

    method


})=>{


    if(!ride.fare){


        throw new AppError(

            "Ride fare not available",

            400

        );

    }






    const payment =

    await paymentRepository.createPayment({

        rideId:
        ride.id,


        passengerId:
        ride.passenger_id,


        amount:
        ride.fare,


        method


    });





    return payment;


};








module.exports={


    makePayment


};