const pool = require("../../database/db");



// Find available Tesla vehicles

const findAvailableVehicles = async () => {


    const result =
    await pool.query(

        `
        SELECT

            vehicles.id AS vehicle_id,

            vehicles.capacity,

            vehicles.driver_id,

            vehicles.current_location_id,

            users.name AS driver_name


        FROM vehicles


        JOIN users

        ON vehicles.driver_id = users.id


        WHERE vehicles.status='ONLINE'

        `

    );


    return result.rows;

};








// Find active pool of vehicle

const findActivePoolByVehicleId = async(vehicleId)=>{


    const result =
    await pool.query(

        `
        SELECT *

        FROM pools

        WHERE vehicle_id=$1

        AND status='ACTIVE'

        `,


        [
            vehicleId
        ]

    );


    return result.rows[0];

};








// Get rides already inside pool

const getPoolRides = async(poolId)=>{


    const result =
    await pool.query(

        `
        SELECT *

        FROM pool_rides

        WHERE pool_id=$1

        `,


        [
            poolId
        ]

    );


    return result.rows;

};









// Update ride fare

const updateRideFare = async(
    rideId,
    fare
)=>{


    const result =
    await pool.query(

        `
        UPDATE rides

        SET fare=$1

        WHERE id=$2

        RETURNING *

        `,


        [
            fare,
            rideId
        ]

    );


    return result.rows[0];

};









// Assign ride to pool

const assignRideToPool = async({


    vehicleId,

    driverId,

    rideId,

    seatsAllocated,

    route


})=>{


    const client =
    await pool.connect();



    try{


        await client.query(
            "BEGIN"
        );





        /*
            Lock vehicle row

        */

        const vehicleResult =
        await client.query(

            `
            SELECT *

            FROM vehicles

            WHERE id=$1

            FOR UPDATE

            `,


            [
                vehicleId
            ]

        );




        if(!vehicleResult.rows.length){

            throw new Error(
                "Vehicle not found"
            );

        }





        const vehicle =
        vehicleResult.rows[0];







        /*
            Lock active pool

        */

        const poolResult =
        await client.query(

            `
            SELECT *

            FROM pools

            WHERE vehicle_id=$1

            AND status='ACTIVE'

            FOR UPDATE

            `,


            [
                vehicleId
            ]

        );




        let activePool =
        poolResult.rows[0];







        /*
            Create pool

        */

        if(!activePool){


            const newPool =
            await client.query(

                `
                INSERT INTO pools

                (
                    vehicle_id,

                    driver_id,

                    status,

                    capacity,

                    current_route

                )


                VALUES

                (
                    $1,

                    $2,

                    'ACTIVE',

                    $3,

                    $4

                )


                RETURNING *

                `,


                [

                    vehicleId,

                    driverId,

                    vehicle.capacity,

                    JSON.stringify(route)

                ]

            );



            activePool =
            newPool.rows[0];


        }








        /*
            Insert ride into pool

        */


        const poolRide =
        await client.query(

            `
            INSERT INTO pool_rides

            (
                pool_id,

                ride_id,

                seats_allocated

            )


            VALUES

            (
                $1,

                $2,

                $3

            )


            RETURNING *

            `,


            [

                activePool.id,

                rideId,

                seatsAllocated

            ]

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
                rideId
            ]

        );






        await client.query(
            "COMMIT"
        );





        return {


            pool:activePool,


            poolRide:
            poolRide.rows[0],


            ride:
            updatedRide.rows[0]


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








module.exports={


    findAvailableVehicles,


    findActivePoolByVehicleId,


    getPoolRides,


    updateRideFare,


    assignRideToPool


};