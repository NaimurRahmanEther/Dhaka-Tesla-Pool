const tripRepository =
require("./trip.repository");


const pool =
require("../../database/db");


const AppError =
require("../../utils/AppError");




// Driver view active trip

const getActiveTrip = async(driverId)=>{


    const trips =
    await tripRepository.findActivePoolByDriverId(

        driverId

    );


    if(!trips.length){

        throw new AppError(

            "No active trip found",

            404

        );

    }


    return trips;

};






// Start trip

const startTrip = async(

    poolId,

    driverId

)=>{


    const client =
    await pool.connect();



    try{


        await client.query(
            "BEGIN"
        );



        const rides =
        await tripRepository.startTrip(

            client,

            poolId

        );



        if(!rides.length){

            throw new AppError(

                "No rides found",

                404

            );

        }





        for(const ride of rides){


            await tripRepository.createRideHistory(

                client,

                {

                    rideId:ride.id,

                    actorId:driverId,

                    action:"STARTED"

                }

            );


        }



        await client.query(
            "COMMIT"
        );



        return rides;


    }
    catch(error){


        await client.query(
            "ROLLBACK"
        );


        throw error;


    }
    finally{


        client.release();

    }


};






// Complete trip

const completeTrip = async(

    poolId,

    driverId

)=>{


    const client =
    await pool.connect();



    try{


        await client.query(
            "BEGIN"
        );



        const rides =
        await tripRepository.completeTrip(

            client,

            poolId

        );



        if(!rides.length){


            throw new AppError(

                "No ongoing rides found",

                404

            );

        }





        for(const ride of rides){


            await tripRepository.createRideHistory(

                client,

                {

                    rideId:ride.id,

                    actorId:driverId,

                    action:"COMPLETED"

                }

            );

        }





        const poolData =
        await tripRepository.completePool(

            client,

            poolId

        );



        await client.query(
            "COMMIT"
        );



        return {

            rides,

            pool:poolData

        };


    }
    catch(error){


        await client.query(
            "ROLLBACK"
        );


        throw error;


    }
    finally{


        client.release();

    }


};





module.exports = {

    getActiveTrip,

    startTrip,

    completeTrip

};