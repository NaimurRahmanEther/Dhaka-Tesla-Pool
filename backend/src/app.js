const express=require('express')
const cors=require('cors')
const app=express();
<<<<<<< Updated upstream

=======
const morgan =require('morgan')
const cookieParser=require('cookie-parser')
const authRouter=require('./modules/auth/auth.routes')
app.use(cors({

    origin:"http://localhost:5173",

    credentials:true

}));
>>>>>>> Stashed changes

app.use(express.json());
<<<<<<< Updated upstream

=======
app.use(morgan('dev'))
app.use(cookieParser())
>>>>>>> Stashed changes

app.get("/",(req,res)=>{
    res.json({
        message:"Dhaka Tesla Pool API is running"
    })
})
app.use("/auth",authRouter);

module.exports=app;