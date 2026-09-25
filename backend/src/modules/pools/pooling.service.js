const pool =
require("../../database/db");



const poolingRepository =
require("./pooling.repository");



const {

    findBestRoute,

    isDetourAcceptable


}

=
require("./pooling.algorithm");



const graphService =
require("../graph/graph.service");



const fareService =
require("../fare/fare.service");



const AppError =
require("../../utils/AppError");









const addPassengerToPool = async ({


    poolId,

    ride


}) => {



    const client =

    await pool.connect();






    try{


        await client.query(

            "BEGIN"

        );









        /*
            Lock pool

        */


        const activePool =

        await poolingRepository.findActivePoolWithLock(


            client,


            poolId


        );






        if(!activePool){


            throw new AppError(


                "Active pool not found",


                404


            );

        }









        /*
            Seat check

        */


        const occupiedSeats =

        await poolingRepository.getOccupiedSeats(


            client,


            poolId


        );





        const availableSeats =


        activePool.capacity -

        occupiedSeats;






        if(

            availableSeats <

            ride.seats_requested

        ){



            throw new AppError(


                "Not enough seats available",


                400


            );

        }









        if(

            !activePool.current_route

        ){


            throw new AppError(


                "Pool route not found",


                400


            );

        }









        const currentRoute =

        activePool.current_route;









        /*
            Optimize route

        */


        const bestRoute =

        await findBestRoute({


            currentRoute:

            currentRoute.path,



            pickup:

            ride.pickup_location_id,



            destination:

            ride.destination_location_id



        });








        if(!bestRoute){


            throw new AppError(


                "No possible route found",


                400


            );

        }









        /*
            Detour check

        */


        const acceptable =

        isDetourAcceptable(


            currentRoute.distance,


            bestRoute.distance


        );






        if(!acceptable){


            throw new AppError(


                "Passenger creates too much detour",


                400


            );

        }









        /*
            Calculate passenger own distance

            Apply pool discount

        */


        const passengerDistance =


        await graphService.calculateRouteDistance([


            ride.pickup_location_id,


            ride.destination_location_id



        ]);









        const fareResult =


        await fareService.calculateRideFare({



            distance:

            passengerDistance,



            isPool:true



        });









        /*
            Add passenger

        */


        const poolRide =


        await poolingRepository.addRideToPool(



            client,



            {



                poolId,



                rideId:

                ride.id,



                seatsAllocated:

                ride.seats_requested



            }



        );









        /*
            Update pool route

        */


        const updatedPool =


        await poolingRepository.updatePoolRoute(



            client,



            {



                poolId,



                route:{



                    path:

                    bestRoute.route,



                    distance:

                    bestRoute.distance



                }



            }



        );









        /*
            Save fare

        */


        await poolingRepository.updateRideFare(



            client,



            {



                rideId:

                ride.id,



                fare:

                fareResult.fare



            }



        );









        /*
            Update ride status

        */


        const updatedRide =


        await client.query(



            `

            UPDATE rides


            SET status='MATCHED'


            WHERE id=$1


            RETURNING *


            `,



            [


                ride.id


            ]



        );









        await client.query(

            "COMMIT"

        );








        return {



            poolRide,



            pool:

            updatedPool,



            ride:

            updatedRide.rows[0],



            fare:

            fareResult.fare



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


    addPassengerToPool


};