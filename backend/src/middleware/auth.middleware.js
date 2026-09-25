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
  // Verify access token
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  // Attach authenticated user
  req.user = decoded;
  next();
});

module.exports = authMiddleware;
