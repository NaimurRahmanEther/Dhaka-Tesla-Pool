require('dotenv').config()

const app = require("./app");
const testConnection=require('./database/testConnection')


const PORT=process.env.PORT||8000;

testConnection()




app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})