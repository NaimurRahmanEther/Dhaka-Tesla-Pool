const jwt = require("jsonwebtoken");

const env = require("../config/env");
const repository = require("../modules/auth/auth.repository");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Access token required", 401);
  }
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    throw new AppError("Invalid authorization format", 401);
  }
  // Check blacklist
  const blacklisted = await repository.isTokenBlacklisted(token);
  if (blacklisted) {
    throw new AppError("Token has been revoked", 401);
  }
  // Verify access token. jsonwebtoken errors carry no statusCode, so without
  // this they would surface as a 500 instead of a 401.
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Access token expired"
        : "Invalid access token";

    throw new AppError(message, 401);
  }
  // Attach authenticated user
  req.user = decoded;
  next();
});

module.exports = authMiddleware;
