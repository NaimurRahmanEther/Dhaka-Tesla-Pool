const rideRepository =
require("./ride.repository");


const locationRepository =
require("../../modules/location//location.repository");


const AppError =
require("../../utils/AppError");





const createRide = async(
    passengerId,
    data
)=>{


    if(
        data.pickupLocationId ===
        data.destinationLocationId
    ){

        throw new AppError(

            "Pickup and destination cannot be same",

            400

        );

    }



    const pickup =
    await locationRepository.findLocationById(

        data.pickupLocationId

    );


    const destination =
    await locationRepository.findLocationById(

        data.destinationLocationId

    );



    if(!pickup || !destination){

        throw new AppError(

            "Invalid location",

            400

        );

    }




    return rideRepository.createRide({

        passengerId,


        pickupLocationId:
        data.pickupLocationId,


        destinationLocationId:
        data.destinationLocationId,


        seatsRequested:
        data.seatsRequested

    });


};





const getMyRides = async(
    passengerId
)=>{


    return rideRepository.findRidesByPassengerId(

        passengerId

    );

};





const cancelRide = async(
    passengerId,
    rideId
)=>{


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



    if(
        ride.passenger_id !== passengerId
    ){

        throw new AppError(

            "You cannot cancel this ride",

            403

        );

    }



    if(
        ride.status !== "REQUESTED"
    ){

        throw new AppError(

            "Ride cannot be cancelled",

            400

        );

    }



    return rideRepository.cancelRide(

        rideId

    );

};





module.exports={

    createRide,

    getMyRides,

    cancelRide

};