const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRouter = require("./modules/auth/auth.routes");
const userRoute = require("./modules/users/user.routes");
const vehicleRouter=require("./modules/vehicles/vehicle.routes")
const locationRouter=require("./modules/location/location.routes")
const graphService=require("./modules/graph/graph.service")
const rideRequest=require("./modules/rides/ride.routes")
app.use(
  cors({
    origin: "http://localhost:5173",

    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "Dhaka Tesla Pool API is running",
  });
});

app.get(
"/api/test-graph",
async(req,res)=>{


    const graph =
    await graphService.getRoadGraph();


    res.json(graph);


});

app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/vehicle",vehicleRouter)
app.use("/location",locationRouter)
app.use("/rides",rideRequest)

module.exports = app;
