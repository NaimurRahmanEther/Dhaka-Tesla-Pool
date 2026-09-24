<<<<<<< Updated upstream
=======
require("dotenv").config();


const env = {

    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: process.env.PORT || 8000,


    DATABASE: {

        HOST: process.env.DB_HOST,

        PORT: process.env.DB_PORT,

        NAME: process.env.DB_NAME,

        USER: process.env.DB_USER,

        PASSWORD: process.env.DB_PASSWORD

    },


    JWT_SECRET: process.env.JWT_SECRET,
    

    JWT_ACCESS_SECRET:process.env.JWT_ACCESS_SECRET,

JWT_REFRESH_SECRET:process.env.JWT_REFRESH_SECRET,


ACCESS_TOKEN_EXPIRE:process.env.ACCESS_TOKEN_EXPIRE,

REFRESH_TOKEN_EXPIRE:process.env.REFRESH_TOKEN_EXPIRE

};


module.exports = env;
>>>>>>> Stashed changes
