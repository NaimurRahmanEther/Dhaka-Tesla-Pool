const errorHandler= (err,req,res,next)=>{
    err.message=err.message||"Internal Server Error"
    err.statusCode=err.statusCode|| 500;

     console.log({
         message: err.message,
        statusCode,
        method: req.method,
        url: req.originalUrl,
        stack: err.stack,
     })
    const response = {
        success: false,
        message
    };

    if(process.env.NODE_ENV==="development"){
        Response.stack=err.stack
    }
    res.status(statusCode).json(Response)
}


module.exports=errorHandler