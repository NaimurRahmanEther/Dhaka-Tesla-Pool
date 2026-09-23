
const env=require('../config/env')
const {Pool}= require('pg')

const pool=new Pool({
   host: env.DATABASE.HOST,

    port: env.DATABASE.PORT,

    database: env.DATABASE.NAME,

    user: env.DATABASE.USER,

    password: env.DATABASE.PASSWORD
})

pool.on("connect", () => {

    console.log("Database connected");

});


pool.on("error", (error) => {

    console.error(
        "Unexpected database error:",
        error.message
    );

});

module.exports=pool;