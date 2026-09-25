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
const driverRoute=require("./modules/routes/route.routes")
const matchingRoute=require("./modules/matching/matching.routes")
const poolingRoute=require("./modules/pools/pooling.routes")
const tripRoute=require('./modules/trips/trip.routes')
const historyRoute=require("./modules/history/history.routes")
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

app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/vehicle",vehicleRouter)
app.use("/location",locationRouter)
app.use("/rides",rideRequest)
app.use("/driver-routes",driverRoute)
app.use("/matching",matchingRoute)
app.use("/pool",poolingRoute);

app.use("/api/trips",tripRoute);
app.use("/api/history",historyRoute);

module.exports = app;
