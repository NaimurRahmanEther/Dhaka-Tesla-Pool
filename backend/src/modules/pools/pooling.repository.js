const pool = require("../../database/db");




// Find active pool and lock row

const findActivePoolWithLock = async (

    client,

    poolId

)=>{


    const result =
    await client.query(

        `

        SELECT

            pools.*,

            vehicles.capacity


        FROM pools


        JOIN vehicles

        ON pools.vehicle_id = vehicles.id



        WHERE pools.id=$1


        AND pools.status='ACTIVE'


        FOR UPDATE OF pools


        `,

        [

            poolId

        ]

    );


    return result.rows[0];


};









// Calculate occupied seats

const getOccupiedSeats = async (

    client,

    poolId

)=>{


    const result =
    await client.query(

        `

        SELECT

        COALESCE(

            SUM(seats_allocated),

            0

        ) AS occupied


        FROM pool_rides


        WHERE pool_id=$1


        `,


        [

            poolId

        ]

    );


    return Number(

        result.rows[0].occupied

    );


};









// Add passenger ride into pool

const addRideToPool = async (

    client,

    {

        poolId,

        rideId,

        seatsAllocated

    }

)=>{


    const result =
    await client.query(

        `

        INSERT INTO pool_rides

        (

            pool_id,

            ride_id,

            seats_allocated

        )


        VALUES($1,$2,$3)


        RETURNING *


        `,


        [

            poolId,

            rideId,

            seatsAllocated

        ]

    );


    return result.rows[0];


};









// Update optimized pool route

const updatePoolRoute = async (

    client,

    {

        poolId,

        route

    }

)=>{


    const result =
    await client.query(

        `

        UPDATE pools


        SET


            current_route=$1,


            route_updated_at=CURRENT_TIMESTAMP



        WHERE id=$2



        RETURNING *


        `,


        [

            JSON.stringify(route),

            poolId

        ]

    );


    return result.rows[0];


};









// Update passenger fare

const updateRideFare = async (

    client,

    {

        rideId,

        fare

    }

)=>{


    const result =
    await client.query(

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









module.exports={


    findActivePoolWithLock,


    getOccupiedSeats,


    addRideToPool,


    updatePoolRoute,


    updateRideFare


};