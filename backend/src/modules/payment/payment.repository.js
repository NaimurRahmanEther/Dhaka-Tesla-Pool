const pool =
require("../../database/db");





const createPayment = async({

    rideId,

    passengerId,

    amount,

    method

})=>{


    const result =
    await pool.query(

        `
        INSERT INTO payments

        (

            ride_id,

            passenger_id,

            amount,

            method,

            status

        )


        VALUES

        (

            $1,

            $2,

            $3,

            $4,

            'PAID'

        )


        RETURNING *

        `,


        [

            rideId,

            passengerId,

            amount,

            method

        ]

    );


    return result.rows[0];


};






const getPaymentByRideId = async(rideId)=>{


    const result =
    await pool.query(

        `
        SELECT *

        FROM payments

        WHERE ride_id=$1

        `,


        [

            rideId

        ]

    );


    return result.rows[0];

};






module.exports={


    createPayment,


    getPaymentByRideId


};