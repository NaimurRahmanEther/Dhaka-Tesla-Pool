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
  const blacklisted = await repository.isTokenBlacklisted(token);
  if (blacklisted) {
    throw new AppError("Token has been revoked", 401);
  }
  // Return 401 for invalid or expired JWTs.
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
  req.user = decoded;
  next();
});

module.exports = authMiddleware;
