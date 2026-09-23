const express=require('express')
const cors=require('cors')
const app=express();
const morgan =require('morgan')

app.use(cors());
app.use(express.json());
app.use(morgan('dev'))

app.get("/",(req,res)=>{
    res.json({
        message:"Dhaka Tesla Pool API is running"
    })
})

module.exports=app;