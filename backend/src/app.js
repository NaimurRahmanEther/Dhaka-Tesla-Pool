const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRouter = require("./modules/auth/auth.routes");
const userRoute = require("./modules/users/user.routes");
const vehicleRouter = require("./modules/vehicles/vehicle.routes");
const locationRouter = require("./modules/location/location.routes");
const graphService = require("./modules/graph/graph.service");
const rideRequest = require("./modules/rides/ride.routes");
const driverRoute = require("./modules/routes/route.routes");
const matchingRoute = require("./modules/matching/matching.routes");
const poolingRoute = require("./modules/pools/pooling.routes");
const tripRoute = require("./modules/trips/trip.routes");
const historyRoute = require("./modules/history/history.routes");
const paymentRouter = require("./modules/payment/payment.routes");
const pool = require("./database/db");
const env = require("./config/env");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((value) => value.trim()),
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

// Liveness plus a real database round trip, so this reports unhealthy when the
// database is down rather than always returning OK.
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      success: true,
      status: "ok",
      database: "up",
      uptime: Math.round(process.uptime()),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: "degraded",
      database: "down",
    });
  }
});

app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/vehicle", vehicleRouter);
app.use("/location", locationRouter);
app.use("/rides", rideRequest);
app.use("/driver-routes", driverRoute);
app.use("/matching", matchingRoute);
app.use("/pool", poolingRoute);

app.use("/trips", tripRoute);
app.use("/history", historyRoute);
app.use("/payments", paymentRouter);

// The error pipeline lives on the app, not the server entry point, so every
// response - including a 404 - comes back in the API's JSON shape.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
