const pool = require("../../database/db");


const poolingRepository =
require("./pooling.repository");


const {
    generatePossibleRoutes,
    findBestRoute,
    isDetourAcceptable

} =
require("./pooling.algorithm");


const graphService =
require("../graph/graph.service");


const AppError =
require("../../utils/AppError");





const addPassengerToPool = async ({

    poolId,

    ride

}) => {


    const client =
    await pool.connect();



    try {


        await client.query(
            "BEGIN"
        );



        /*
            1.
            Lock pool row

            Prevent two passengers
            updating same pool
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
            2.
            Check available seats

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





        /*
            3.
            Get current pool route

        */


        if(
            !activePool.current_route
        ){


            throw new AppError(

                "Pool route not found",

                400

            );

        }



        const currentRoute =
        activePool.current_route.path;



        const oldDistance =
        activePool.current_route.distance;





        /*
            4.
            Generate possible routes

            Example:

            A-B-C-D-E


            New passenger:

            C-X


            Possible:

            A-B-C-X-D-E

            A-B-C-D-X-E

        */


        const possibleRoutes =
        generatePossibleRoutes(

            currentRoute,

            ride.pickup_location_id,

            ride.destination_location_id

        );





        if(
            !possibleRoutes.length
        ){


            throw new AppError(

                "No possible route found",

                400

            );

        }






        /*
            5.
            Calculate distance
            for every possible route

        */


        const distanceMap = {};



        for(
            const route of possibleRoutes
        ){


            const result =
            await graphService.calculateRouteDistance(

                route

            );



            distanceMap[
                JSON.stringify(route)
            ] = result;


        }







        /*
            6.
            Select shortest route

        */


        const bestRoute =
        findBestRoute(

            possibleRoutes,

            distanceMap

        );





        if(
            !bestRoute.route
        ){


            throw new AppError(

                "Cannot optimize route",

                400

            );

        }







        /*
            7.
            Check detour limit

        */


        const acceptable =
        isDetourAcceptable(

            oldDistance,

            bestRoute.distance

        );




        if(!acceptable){


            throw new AppError(

                "Passenger creates too much detour",

                400

            );

        }







        /*
            8.
            Add passenger into pool

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
            9.
            Update pool route

        */


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
            10.
            Update ride status

        */


        await client.query(

            `

            UPDATE rides

            SET status='MATCHED'


            WHERE id=$1

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


            updatedRoute:{

                path:
                bestRoute.route,


                distance:
                bestRoute.distance

            }


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