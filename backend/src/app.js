const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRouter = require("./modules/auth/auth.routes");
const userRoute = require("./modules/users/user.routes");

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

module.exports = app;
